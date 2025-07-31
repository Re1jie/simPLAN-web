import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval, differenceInCalendarDays, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '../api';
import UpdatePlanModal from '../components/UpdatePlanModal';

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

// Fungsi-fungsi helper (tidak ada perubahan)
const getPortColorClass = (portName) => {
    if (!portName) return PORT_COLORS.DEFAULT;
    const normalizedPortName = portName.toUpperCase();
    return PORT_COLORS[normalizedPortName] || PORT_COLORS.DEFAULT;
};

const parseTimeRangeToMinutes = (timeString) => {
    if (!timeString.includes('-')) {
        const [hour, minute] = timeString.split(':').map(Number);
        const start = hour * 60 + minute;
        return { start, end: start + 1 };
    }
    const [startStr, endStr] = timeString.split('-');
    let start = 0;
    let end = 24 * 60 - 1;
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

const findScheduleConflicts = (dataMatriks) => {
    const schedulesByPortAndDate = {};
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
    const allConflicts = [];
    for (const dateKey in schedulesByPortAndDate) {
        for (const pelabuhan in schedulesByPortAndDate[dateKey]) {
            const schedules = schedulesByPortAndDate[dateKey][pelabuhan];
            if (schedules.length < 2) continue;
            const n = schedules.length;
            const parsedTimes = schedules.map(s => parseTimeRangeToMinutes(s.waktu));
            const adj = Array.from({ length: n }, () => []);
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const timeA = parsedTimes[i];
                    const timeB = parsedTimes[j];
                    if (timeA.start < timeB.end && timeB.start < timeA.end) {
                        adj[i].push(j);
                        adj[j].push(i);
                    }
                }
            }
            const visited = Array(n).fill(false);
            for (let i = 0; i < n; i++) {
                if (!visited[i]) {
                    const componentIndices = [];
                    const stack = [i];
                    visited[i] = true;
                    while (stack.length > 0) {
                        const u = stack.pop();
                        componentIndices.push(u);
                        for (const v of adj[u]) {
                            if (!visited[v]) {
                                visited[v] = true;
                                stack.push(v);
                            }
                        }
                    }
                    if (componentIndices.length > 1) {
                        const conflictingSchedules = componentIndices.map(index => schedules[index]);
                        conflictingSchedules.sort((a, b) => a.kapal.localeCompare(b.kapal));
                        allConflicts.push({
                            date: dateKey,
                            port: pelabuhan,
                            kapal: conflictingSchedules.map(s => s.kapal),
                            waktu: conflictingSchedules.map(s => s.waktu),
                        });
                    }
                }
            }
        }
    }
    return allConflicts;
};

const processJadwalData = (jadwal, allShipNames) => {
    if (!jadwal || jadwal.length === 0) {
        return { dataMatriks: {}, dateHeaders: [], kapalList: allShipNames };
    }
    const groupedSchedules = {};
    jadwal.forEach(item => {
        const key = `${item.nama_kapal}|${item.pelabuhan}|${item.waktu_tiba}`;
        if (!groupedSchedules[key]) {
            groupedSchedules[key] = [];
        }
        groupedSchedules[key].push(item);
    });
    const mergedJadwal = [];
    Object.values(groupedSchedules).forEach(group => {
        if (group.length > 1) {
            const arrivalOnly = group.find(item => item.waktu_tiba && !item.waktu_berangkat);
            const fullSchedule = group.find(item => item.waktu_tiba && item.waktu_berangkat);
            if (arrivalOnly && fullSchedule) {
                const combinedSchedule = {
                    ...arrivalOnly,
                    waktu_berangkat: fullSchedule.waktu_berangkat,
                    voyage: `${arrivalOnly.voyage} / ${fullSchedule.voyage}`
                };
                mergedJadwal.push(combinedSchedule);
                const otherItems = group.filter(item => item.id !== arrivalOnly.id && item.id !== fullSchedule.id);
                mergedJadwal.push(...otherItems);
            } else {
                mergedJadwal.push(...group);
            }
        } else {
            mergedJadwal.push(...group);
        }
    });
    const finalJadwal = mergedJadwal;
    const parseDisplayString = (isoString) => {
        if (!isoString) return null;
        const year = parseInt(isoString.substring(0, 4), 10);
        const month = parseInt(isoString.substring(5, 7), 10) - 1;
        const day = parseInt(isoString.substring(8, 10), 10);
        const hour = parseInt(isoString.substring(11, 13), 10);
        const minute = parseInt(isoString.substring(14, 16), 10);
        return new Date(year, month, day, hour, minute);
    };
    const allDates = finalJadwal.flatMap(item => [
        parseDisplayString(item.waktu_tiba),
        parseDisplayString(item.waktu_berangkat || item.waktu_tiba)
    ]);
    const startDate = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const endDate = endOfDay(new Date(Math.max(...allDates.map(d => d.getTime()))));
    const dateHeaders = eachDayOfInterval({ start: startDate, end: endDate });
    const dataMatriks = {};
    allShipNames.forEach(kapal => { dataMatriks[kapal] = {}; });
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

const DAFTAR_KAPAL_LENGKAP = [
  "KM. AWU", "KM. BINAIYA", "KM. BUKIT RAYA", "KM. BUKIT SIGUNTANG", "KM. CIREMAI",
  "KM. DOBONSOLO", "KM. DOROLONDA", "KM. EGON", "KFC. JET LINER", "KM. KELIMUTU",
  "KM. KELUD", "KM. LABOBAR", "KM. LAMBELU", "KM. LAWIT", "KM. LEUSER",
  "KM. NGGAPULU", "KM. PANGRANGO", "KM. SANGIANG", "KM. SIRIMAU", "KM. SINABUNG",
  "KM. TATAMAILAU", "KM. TIDAR", "KM. TILONGKABILA", "KM. GUNUNG DEMPO", "KM. WILIS"
].sort();

const ConflictCard = ({ conflict }) => (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-red-200">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-800">
                Pelabuhan <span className="text-red-600">{conflict.port}</span>
            </h3>
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {conflict.date}
                </span>
                <button
                    onClick={() => {
                        const targetId = `header-${conflict.date}`;
                        const el = document.getElementById(targetId);
                        if (el) {
                            el.scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',
                                inline: 'center'
                            });
                        }
                    }}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                    Cek
                </button>
            </div>
        </div>
        <div className="space-y-1.5 pt-2">
            {conflict.kapal.map((kapal, index) => (
                <div key={index} className="flex justify-between items-center bg-red-50 p-1.5 rounded-md text-sm">
                    <span className="font-semibold text-red-800">{kapal}</span>
                    <span className="text-red-700 font-mono bg-red-100 px-2 py-0.5 rounded text-xs">
                        {conflict.waktu[index]}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

// ===================================================
// KOMPONEN UTAMA                                     =
// ===================================================
function PlanPreviewPage() {
    const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
    const [processedData, setProcessedData] = useState({ dataMatriks: {}, dateHeaders: [], kapalList: [] });
    const [dockingSchedules, setDockingSchedules] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [voyageList, setVoyageList] = useState([]);
    const [kapalList, setKapalList] = useState([]);
    const [jadwalData, setJadwalData] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState('Semua');
    const tableContainerRef = useRef(null);

    // =========================================================================
    // BAGIAN 2: LOGIKA STATE BARU UNTUK RESIZABLE CONTAINER                   =
    // =========================================================================
    const [isResizing, setIsResizing] = useState(false);
    // Tinggi awal bisa diatur lebih dinamis, misal 60vh
    const [containerHeight, setContainerHeight] = useState('80vh'); 
    const resizableContainerRef = useRef(null);

    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault(); 
    };

    const handleMouseMove = (e) => {
        if (!isResizing || !resizableContainerRef.current) return;
        // Hitung tinggi baru berdasarkan posisi mouse Y relatif terhadap window
        const newHeight = e.clientY - resizableContainerRef.current.offsetTop;
        setContainerHeight(`${newHeight}px`);
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };
    
    // Tambahkan dan hapus event listener dari window
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);


    const parseDateKeyToSortable = (dateKey) => {
        const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
            'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
        };
        const parts = dateKey.split('-');
        if (parts.length !== 3) return new Date(0);
        const day = parseInt(parts[0], 10);
        const monthIndex = monthMap[parts[1]];
        const year = parseInt(parts[2], 10) + 2000;
        if (!isNaN(day) && monthIndex !== undefined && !isNaN(year)) {
            return new Date(year, monthIndex, day);
        }
        return new Date(0);
    };
    
    const sortedConflicts = useMemo(() => {
        return [...conflicts].sort((a, b) => parseDateKeyToSortable(a.date) - parseDateKeyToSortable(b.date));
    }, [conflicts]);

    const availableMonths = useMemo(() => {
        const months = new Set(sortedConflicts.map(c => c.date.split('-')[1]));
        return ['Semua', ...Array.from(months)];
    }, [sortedConflicts]);

    const filteredConflicts = useMemo(() => {
        if (selectedMonth === 'Semua') return sortedConflicts;
        return sortedConflicts.filter(c => c.date.includes(`-${selectedMonth}-`));
    }, [selectedMonth, sortedConflicts]);

    useEffect(() => {
        const fetchDataAndProcess = async () => {
            setLoading(true);
            const token = sessionStorage.getItem('authToken');
            if (!token) { navigate('/login'); return; }
            try {
                const [jadwalResponse, dockingResponse] = await Promise.all([
                    api.get('/jadwal', { headers: { 'Authorization': `Bearer ${token}` } }),
                    api.get('/docking', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                const data = processJadwalData(jadwalResponse.data, DAFTAR_KAPAL_LENGKAP);
                setProcessedData(data);
                setDockingSchedules(dockingResponse.data);
                setJadwalData(jadwalResponse.data);
                const uniqueVoyages = [...new Set(jadwalResponse.data.map(item => item.voyage))];
                setVoyageList(uniqueVoyages.sort((a, b) => a - b));
                const uniqueKapal = [...new Set(jadwalResponse.data.map(item => item.nama_kapal))];
                setKapalList(uniqueKapal.sort());
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

    const handleOpenUpdateModal = () => setUpdateModalOpen(true);
    const handleCloseUpdateModal = () => setUpdateModalOpen(false);

    const handleGoToToday = () => {
        const todayDateKey = format(new Date(), 'dd-MMM-yy', { locale: id });
        const todayColumn = document.getElementById(`header-${todayDateKey}`);
        if (todayColumn && tableContainerRef.current) {
            const container = tableContainerRef.current;
            const scrollLeft = todayColumn.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (todayColumn.clientWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        } else {
            alert("Tanggal hari ini tidak ditemukan dalam rentang jadwal.");
        }
    };

    if (loading) return <div className="text-center p-8">Memuat data jadwal...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    const getDockingInfoForCell = (kapal, date) => {
        for (const schedule of dockingSchedules) {
            if (schedule.nama_kapal === kapal) {
                const start = new Date(schedule.waktu_mulai_docking);
                const end = new Date(schedule.waktu_selesai_docking);
                if (isWithinInterval(startOfDay(date), { start: startOfDay(start), end: startOfDay(end) })) {
                    return schedule;
                }
            }
        }
        return null;
    };

    const isCellInConflict = (dateKey, kapal, pelabuhan) => {
        return conflicts.some(c => c.date === dateKey && c.port === pelabuhan && c.kapal.includes(kapal));
    };

    return (
        <div className="flex flex-col h-screen max-h-screen p-6 bg-transparent overflow-hidden"> 
            <header className="flex-shrink-0 mb-4">
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-3xl font-bold text-gray-800">Plan Preview</h1>
                    <div className="flex items-center space-x-3">
                        <button onClick={handleGoToToday} className="px-4 py-2 text-sm font-semibold bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
                            Ke Hari Ini
                        </button>
                        <button onClick={handleOpenUpdateModal} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            Update ke Plan
                        </button>
                    </div>
                </div>
            </header>

            {/* 👇 PERUBAHAN DI SINI: Container ini sekarang yang 'flex-grow' */}
            <div ref={resizableContainerRef} className="flex-grow flex flex-col min-h-0">
                {/* 👇 Container ini HANYA mengatur tinggi, tidak lagi 'flex-grow' */}
                <div style={{ height: containerHeight }} className="min-h-[200px]">
                    <div className="flex h-full min-h-0 gap-6">
                        <main className="flex-1 flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                            <div ref={tableContainerRef} className="flex-grow overflow-auto">
                                <table className="table-fixed w-full border-collapse">
                                    <thead className="bg-gray-600 text-white sticky top-0 z-20 border-b">
                                        <tr>
                                            <th className="w-8 p-2 sticky left-0 bg-gray-600 text-white z-10 shadow-[inset_-1px_0_0_0_#A0AEC0]">NO</th>
                                            <th className="w-48 p-2 sticky left-8 bg-gray-600 text-white z-10 shadow-[inset_-1px_0_0_0_#A0AEC0]">NAMA KAPAL</th>
                                            {processedData.dateHeaders.map(date => {
                                                const dateKey = format(date, 'dd-MMM-yy', { locale: id });
                                                return (
                                                    <th key={dateKey} id={`header-${dateKey}`} className="border-r w-32 p-2">
                                                        <div>{format(date, 'd-MMM-yy', { locale: id })}</div>
                                                        <div className="font-normal">{format(date, 'eeee', { locale: id })}</div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {processedData.kapalList.map((kapal, index) => {
                                            let skipDays = 0;
                                            return (
                                                <tr key={kapal} className="text-center">
                                                    <td className="border-b border-black w-8 p-2 sticky left-0 bg-white z-10 shadow-[inset_-1px_0_0_0_#000]">{index + 1}</td>
                                                    <td className="border-b border-black w-48 p-2 sticky left-8 bg-white z-10 shadow-[inset_-1px_0_0_0_#000]">{kapal}</td>
                                                    {processedData.dateHeaders.map(date => {
                                                        if (skipDays > 0) {
                                                            skipDays--;
                                                            return null;
                                                        }
                                                        const dateKey = format(date, 'dd-MMM-yy', { locale: id });
                                                        const dockingInfo = getDockingInfoForCell(kapal, date);
                                                        if (dockingInfo) {
                                                            const startDate = startOfDay(new Date(dockingInfo.waktu_mulai_docking));
                                                            if (isSameDay(startOfDay(date), startDate)) {
                                                                const endDate = startOfDay(new Date(dockingInfo.waktu_selesai_docking));
                                                                const colspan = differenceInCalendarDays(endDate, startDate) + 1;
                                                                skipDays = colspan - 1;
                                                                return (
                                                                    <td key={dateKey} colSpan={colspan} className="border-b border-r border-black p-1 align-middle bg-black text-white relative">
                                                                        <div className="flex items-center justify-center h-full text-xl font-bold text-center">{dockingInfo.detail_docking}</div>
                                                                    </td>
                                                                );
                                                            }
                                                            return null;
                                                        }
                                                        const jadwalDiHariIni = processedData.dataMatriks[kapal]?.[dateKey];
                                                        return (
                                                            <td key={dateKey} className="border-b border-r border-black w-32 p-1 align-top">
                                                                {jadwalDiHariIni?.map((item, idx) => {
                                                                    const isThisItemInConflict = isCellInConflict(dateKey, kapal, item.pelabuhan);
                                                                    return (
                                                                        <div key={idx} className={`mb-1 rounded ${isThisItemInConflict ? 'animate-blink' : ''}`}>
                                                                            <div className={`${getPortColorClass(item.pelabuhan)} text-xs font-bold rounded-t p-1`}>{item.pelabuhan}</div>
                                                                            <div className="bg-gray-100 text-xs rounded-b p-1">{item.waktu}</div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </main>

                        {conflicts.length > 0 && (
                            <aside className="w-80 flex-shrink-0 bg-white flex flex-col rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b bg-yellow-100">
                                    <h2 className="text-lg font-bold text-yellow-800">🚨 Jadwal Bentrok ({filteredConflicts.length})</h2>
                                </div>
                                <div className="p-2 border-b">
                                    <div className="flex space-x-1 bg-yellow-200 p-1 rounded-lg justify-center">
                                        {availableMonths.map(month => (
                                            <button key={month} onClick={() => setSelectedMonth(month)}
                                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                                    selectedMonth === month ? 'bg-yellow-800 text-white shadow' : 'text-yellow-900 hover:bg-yellow-300'
                                                }`}
                                            >{month}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-grow overflow-y-auto p-3 space-y-3">
                                    {filteredConflicts.map((c, index) => (
                                       <ConflictCard key={index} conflict={c} />
                                    ))}
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
                
                {/* 👇 Handle untuk me-resize */}
                <div 
                    onMouseDown={handleMouseDown}
                    className="w-full h-2 mt-1 flex-shrink-0 cursor-ns-resize bg-gray-400 hover:bg-blue-500 transition-colors rounded"
                    title="Tarik untuk mengubah ukuran"
                />
            </div>


            <UpdatePlanModal
                isOpen={isUpdateModalOpen}
                onClose={handleCloseUpdateModal}
                kapalList={kapalList}
                voyageList={voyageList}
                allJadwal={jadwalData}
            />
        </div>
    );
}

export default PlanPreviewPage;