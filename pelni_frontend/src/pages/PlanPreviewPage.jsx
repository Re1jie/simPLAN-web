import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

// Definisikan warna untuk setiap pelabuhan
const PORT_COLORS = {
    'SURABAYA': 'bg-green-200 text-green-900',
    'TG. PRIOK': 'bg-red-600 text-white',
    'TG.PRIOK': 'bg-red-600 text-red-100',
    'MAKASSAR': 'bg-blue-600 text-blue-100',
    'PONTIANAK': 'bg-green-600 text-green-100',
    'KIJANG': 'bg-blue-600 text-blue-100',
    'BITUNG': 'bg-yellow-100 text-yellow-900',
    'BAU-BAU': 'bg-orange-200 text-cream-900',
    'LABUAN BAJO': 'bg-blue-200 text-blue-900',
    'BIMA': 'bg-blue-950 text-lime-100',
    'BENOA': 'bg-lime-700 text-lime-100',
    'PARE-PARE': 'bg-yellow-300 text-yellow-900',
    'KUMAI': 'bg-gray-500 text-gray-100',
    'WAINGAPU': 'bg-teal-600 text-teal-100',
    'FAK-FAK': 'bg-violet-400 text-violet-100',
    'BANDA': 'bg-orange-700 text-orange-100',
    'KUPANG': 'bg-amber-950 text-amber-100',
    'TUAL': 'bg-lime-700 text-lime-100',
    'SEMARANG': 'bg-pink-700 text-pink-100',
    'SAUMLAKI': 'bg-rose-300 text-rose-900',
    'SORONG': 'bg-fuchsia-700 text-fuchsia-100',
    'DEFAULT': 'bg-gray-200 text-gray-900'
    
};

// Fungsi untuk mendapatkan kelas warna berdasarkan nama pelabuhan
const getPortColorClass = (portName) => {
    if (!portName) return PORT_COLORS.DEFAULT;

    // Normalisasi nama pelabuhan (misal: "Tg.Priok" -> "TG.PRIOK")
    const normalizedPortName = portName.toUpperCase();
  
    return PORT_COLORS[normalizedPortName] || PORT_COLORS.DEFAULT;
};


// ===================================================================
//  FUNGSI UNTUK MENDETEKSI KONFLIK JADWAL (BARU)                    =
// ===================================================================

/**
 * Helper untuk mengubah rentang waktu string menjadi menit.
 * Contoh: "12:00-14:00" -> { start: 720, end: 840 }
 * "12:00-"      -> { start: 720, end: 1439 } (akhir hari)
 * "-16:00"      -> { start: 0, end: 960 }   (awal hari)
 */
const parseTimeRangeToMinutes = (timeString) => {
    if (!timeString.includes('-')) {
        // Jika hanya satu waktu (misal: "12:00"), anggap sebagai durasi singkat (1 menit)
        const [hour, minute] = timeString.split(':').map(Number);
        const start = hour * 60 + minute;
        return { start, end: start + 1 };
    }

    const [startStr, endStr] = timeString.split('-');
    let start = 0;
    let end = 24 * 60 - 1; // Menit terakhir dalam sehari

    if (startStr) {
        const [hour, minute] = startStr.split(':').map(Number);
        start = hour * 60 + minute;
    }
    if (endStr) {
        const [hour, minute] = endStr.split(':').map(Number);
        end = hour * 60 + minute;
    }
    return { start, end };
};


/**
 * Fungsi utama untuk mencari konflik dari data matriks yang sudah diproses.
 * @param {object} dataMatriks - Objek matriks jadwal dari processJadwalData.
 * @returns {array} - Array berisi objek-objek konflik yang ditemukan.
 */
const findScheduleConflicts = (dataMatriks) => {
    const schedulesByPortAndDate = {};

    // Langkah 1: Kelompokkan jadwal berdasarkan tanggal dan pelabuhan
    for (const kapal in dataMatriks) {
        for (const dateKey in dataMatriks[kapal]) {
            if (!schedulesByPortAndDate[dateKey]) {
                schedulesByPortAndDate[dateKey] = {};
            }
            const jadwalDiHariIni = dataMatriks[kapal][dateKey];
            jadwalDiHariIni.forEach(item => {
                if (!schedulesByPortAndDate[dateKey][item.pelabuhan]) {
                    schedulesByPortAndDate[dateKey][item.pelabuhan] = [];
                }
                schedulesByPortAndDate[dateKey][item.pelabuhan].push({
                    kapal,
                    waktu: item.waktu,
                });
            });
        }
    }

    const conflicts = [];

    // Langkah 2: Iterasi setiap pelabuhan & tanggal, lalu cek tumpang tindih
    for (const dateKey in schedulesByPortAndDate) {
        for (const pelabuhan in schedulesByPortAndDate[dateKey]) {
            const schedules = schedulesByPortAndDate[dateKey][pelabuhan];
            if (schedules.length < 2) continue; // Tidak mungkin ada konflik jika < 2 kapal

            // Bandingkan setiap pasang jadwal di lokasi yang sama
            for (let i = 0; i < schedules.length; i++) {
                for (let j = i + 1; j < schedules.length; j++) {
                    const scheduleA = schedules[i];
                    const scheduleB = schedules[j];

                    const timeA = parseTimeRangeToMinutes(scheduleA.waktu);
                    const timeB = parseTimeRangeToMinutes(scheduleB.waktu);

                    // Kondisi tumpang tindih: (StartA < EndB) and (StartB < EndA)
                    if (timeA.start < timeB.end && timeB.start < timeA.end) {
                        conflicts.push({
                            date: dateKey,
                            port: pelabuhan,
                            kapal: [scheduleA.kapal, scheduleB.kapal].sort(),
                            waktu: [scheduleA.waktu, scheduleB.waktu]
                        });
                    }
                }
            }
        }
    }
    return conflicts;
};





// ===================================================
// BAGIAN 1: FUNGSI UNTUK MENGOLAH DATA JADWAL       =
// ===================================================
const processJadwalData = (jadwal, allShipNames) => {
    if (!jadwal || jadwal.length === 0) {
        return { dataMatriks: {}, dateHeaders: [], kapalList: allShipNames };
    }

    // =============================================================================
    // LANGKAH 1: Kelompokkan jadwal berdasarkan kunci unik (kapal-pelabuhan-waktu tiba)
    // untuk menemukan jadwal yang berpotensi digabung.
    // =============================================================================
    const groupedSchedules = {};
    jadwal.forEach(item => {
        const key = `${item.nama_kapal}|${item.pelabuhan}|${item.waktu_tiba}`;
        if (!groupedSchedules[key]) {
            groupedSchedules[key] = [];
        }
        groupedSchedules[key].push(item);
    });

    // =============================================================================
    // LANGKAH 2: Proses penggabungan
    // Buat array jadwal baru yang sudah berisi data hasil penggabungan.
    // =============================================================================
    const mergedJadwal = [];
    Object.values(groupedSchedules).forEach(group => {
        if (group.length > 1) { // Hanya proses grup yang punya lebih dari 1 entri (kandidat merge)
            const arrivalOnly = group.find(item => item.waktu_tiba && !item.waktu_berangkat);
            const fullSchedule = group.find(item => item.waktu_tiba && item.waktu_berangkat);

            // Jika ditemukan pasangan yang cocok (akhir voyage 1 & awal voyage 2)
            if (arrivalOnly && fullSchedule) {
                // Buat entri baru yang sudah digabung
                const combinedSchedule = {
                    ...arrivalOnly, // Ambil basis data dari entri kedatangan
                    waktu_berangkat: fullSchedule.waktu_berangkat, // Ambil waktu berangkat dari entri berikutnya
                    voyage: `${arrivalOnly.voyage} / ${fullSchedule.voyage}` // Gabungkan info voyage
                };
                mergedJadwal.push(combinedSchedule);

                // Tambahkan sisa item di grup jika ada yang tidak cocok (jarang terjadi)
                const otherItems = group.filter(item => item.id !== arrivalOnly.id && item.id !== fullSchedule.id);
                mergedJadwal.push(...otherItems);
            } else {
                // Jika tidak ada pasangan yang cocok, masukkan semua item dari grup apa adanya
                mergedJadwal.push(...group);
            }
        } else {
            // Jika grup hanya punya 1 item, langsung masukkan
            mergedJadwal.push(...group);
        }
    });

    // Mulai dari sini, kita gunakan `mergedJadwal` bukan `jadwal` lagi
    const finalJadwal = mergedJadwal;

    // Helper yang sudah benar dari sebelumnya
    const parseDisplayString = (isoString) => {
        if (!isoString) return null;
        const year = parseInt(isoString.substring(0, 4), 10);
        const month = parseInt(isoString.substring(5, 7), 10) - 1;
        const day = parseInt(isoString.substring(8, 10), 10);
        const hour = parseInt(isoString.substring(11, 13), 10);
        const minute = parseInt(isoString.substring(14, 16), 10);
        return new Date(year, month, day, hour, minute);
    };

    // Tentukan rentang tanggal dari semua data jadwal yang sudah digabung
    const allDates = finalJadwal.flatMap(item => [
        parseDisplayString(item.waktu_tiba),
        parseDisplayString(item.waktu_berangkat || item.waktu_tiba)
    ]);
    const startDate = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const endDate = endOfDay(new Date(Math.max(...allDates.map(d => d.getTime()))));
    const dateHeaders = eachDayOfInterval({ start: startDate, end: endDate });

    const dataMatriks = {};
    allShipNames.forEach(kapal => { dataMatriks[kapal] = {}; });

    // =============================================================================
    // LANGKAH 3: Gunakan data yang sudah digabung untuk mengisi matriks
    // Logika di bawah ini tidak perlu diubah, karena sekarang ia menerima data yang sudah bersih.
    // =============================================================================
    finalJadwal.forEach(item => {
        const tiba = parseDisplayString(item.waktu_tiba);
        const berangkat = parseDisplayString(item.waktu_berangkat) || tiba;

        const tibaDateKey = format(tiba, 'dd-MMM-yy', { locale: id });
        const berangkatDateKey = format(berangkat, 'dd-MMM-yy', { locale: id });

        const eta = item.waktu_tiba.substring(11, 16);
        const etd = item.waktu_berangkat ? item.waktu_berangkat.substring(11, 16) : "";

        if (tibaDateKey === berangkatDateKey) {
            if (!dataMatriks[item.nama_kapal][tibaDateKey]) { dataMatriks[item.nama_kapal][tibaDateKey] = []; }
            dataMatriks[item.nama_kapal][tibaDateKey].push({
                pelabuhan: item.pelabuhan,
                waktu: etd ? `${eta}-${etd}` : eta
            });
        } else {
            // Logika untuk jadwal lintas hari (overnight)
            if (!dataMatriks[item.nama_kapal][tibaDateKey]) { dataMatriks[item.nama_kapal][tibaDateKey] = []; }
            dataMatriks[item.nama_kapal][tibaDateKey].push({
                pelabuhan: item.pelabuhan,
                waktu: `${eta}-`
            });

            if (!dataMatriks[item.nama_kapal][berangkatDateKey]) { dataMatriks[item.nama_kapal][berangkatDateKey] = []; }
            dataMatriks[item.nama_kapal][berangkatDateKey].push({
                pelabuhan: item.pelabuhan,
                waktu: `-${etd}`
            });
        }
    });

    return { dataMatriks, dateHeaders, kapalList: allShipNames.sort() };
};


// ... (Sisa komponen PlanPreviewPage.jsx tidak perlu diubah)
// Daftar kapal lengkap, fungsi utama komponen, useEffect, dan bagian return JSX tetap sama.
// Pastikan saja fungsi processJadwalData di atas menggantikan yang lama.

// Daftar kapal lengkap sesuai permintaan Anda
const DAFTAR_KAPAL_LENGKAP = [
  "KM. AWU", "KM. BINAIYA", "KM. BUKIT RAYA", "KM. BUKIT SIGUNTANG", "KM. CIREMAI",
  "KM. DOBONSOLO", "KM. DOROLONDA", "KM. EGON", "KFC. JET LINER", "KM. KELIMUTU",
  "KM. KELUD", "KM. LABOBAR", "KM. LAMBELU", "KM. LAWIT", "KM. LEUSER",
  "KM. NGGAPULU", "KM. PANGRANGO", "KM. SANGIANG", "KM. SIRIMAU", "KM. SINABUNG",
  "KM. TATAMAILAU", "KM. TIDAR", "KM. TILONGKABILA", "KM. GUNUNG DEMPO", "KM. WILIS"
].sort();


function PlanPreviewPage() {
    const [processedData, setProcessedData] = useState({ dataMatriks: {}, dateHeaders: [], kapalList: [] });
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDataAndProcess = async () => {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) { navigate('/login'); return; }
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/jadwal', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Setelah data diterima, langsung proses dengan logika baru
                const data = processJadwalData(response.data, DAFTAR_KAPAL_LENGKAP);
                setProcessedData(data);

                const foundConflicts = findScheduleConflicts(data.dataMatriks);
                setConflicts(foundConflicts);
            } catch (err) {
                console.error("Gagal mengambil data jadwal:", err);
                setError('Gagal mengambil data dari server.');
            } finally {
                setLoading(false);
            }
        };
        fetchDataAndProcess();
    }, [navigate]);

    if (loading) { return <div className="text-center p-8">Memuat data jadwal...</div>; }
    if (error) { return <div className="text-center p-8 text-red-500">{error}</div>; }

    const isCellInConflict = (dateKey, kapal, pelabuhan) => {
        return conflicts.some(c => 
            c.date === dateKey && 
            c.port === pelabuhan && 
            c.kapal.includes(kapal)
        );
    };

    // =================================================================================
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Plan Preview</h1>
                <div className="overflow-auto max-h-[80vh] bg-white shadow-md rounded-lg">
                <table className="table-fixed w-full border-collapse">
                    <thead className="bg-gray-200 sticky top-0 z-20">
                    <tr>
                        <th className="border w-8 p-2 sticky left-0 bg-gray-200 z-10">NO</th>
                        <th className="border w-48 p-2 sticky left-8 bg-gray-200 z-10">NAMA KAPAL</th>
                        {processedData.dateHeaders.map(date => (
                        <th key={date} className="border w-32 p-2">
                            <div>{format(date, 'd-MMM-yy', { locale: id })}</div>
                            <div>{format(date, 'eeee', { locale: id })}</div>
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {processedData.kapalList.map((kapal, index) => (
                        <tr key={kapal} className="text-center">
                        <td className="border w-8 p-2 sticky left-0 bg-white z-10">{index + 1}</td>
                        <td className="border w-48 p-2 sticky left-8 bg-white z-10">{kapal}</td>
                        {processedData.dateHeaders.map(date => {
                            const dateKey = format(date, 'dd-MMM-yy', { locale: id });
                            const jadwalDiHariIni = processedData.dataMatriks[kapal]?.[dateKey];
                            const hasConflict = jadwalDiHariIni?.some(item =>
                                isCellInConflict(dateKey, kapal, item.pelabuhan)
                            );
                            return (
                                <td key={date} className="border w-32 p-1 align-top">
                                {jadwalDiHariIni?.map((item, idx) => {
                                    
                                    const isThisItemInConflict = isCellInConflict(dateKey, kapal, item.pelabuhan);

                                    return (
                                    // Ganti 'blinking-conflict' dengan 'animate-blink'
                                    <div 
                                        key={idx} 
                                        className={`mb-1 rounded ${isThisItemInConflict ? 'animate-blink' : ''}`}
                                    >
                                        <div className={`${getPortColorClass(item.pelabuhan)} text-xs font-bold rounded-t p-1`}>
                                        {item.pelabuhan}
                                        </div>
                                        <div className="bg-gray-100 text-xs rounded-b p-1">
                                        {item.waktu}
                                        </div>
                                    </div>
                                    );
                                })}
                                </td>
                            );
                        })}
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
                {conflicts.length > 0 && (
                    <div className="mt-10 overflow-auto max-h-[80vh] bg-white shadow-md rounded-lg">
                        <div className="p-4 bg-yellow-100">
                        <h2 className="text-xl font-bold text-yellow-800 mb-4">🚨 Peringatan Jadwal Berbenturan</h2>
                        <div className="space-y-3">
                            {conflicts.map((c, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg shadow">
                                    <p>
                                        <strong>Pelabuhan:</strong> <span className="font-mono p-1 bg-gray-200 rounded">{c.port}</span>
                                    </p>
                                    <p>
                                        <strong>Tanggal:</strong> <span className="font-mono p-1 bg-gray-200 rounded">{c.date}</span>
                                    </p>
                                    <p>
                                        <strong>Konflik Antara:</strong> {c.kapal.join(' dan ')}
                                    </p>
                                    <p className="text-sm mt-1">
                                        ({c.kapal[0]}: <strong>{c.waktu[0]}</strong> vs {c.kapal[1]}: <strong>{c.waktu[1]}</strong>)
                                    </p>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>      
                )}
        </div>
    );
}

export default PlanPreviewPage;