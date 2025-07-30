import { useState, useEffect, useCallback } from 'react';
import api from '../api'; // Pastikan path ini benar
import dayjs from 'dayjs'; // Library untuk manipulasi tanggal & waktu

/**
 * Komponen Modal untuk Mengedit Jadwal Voyage.
 * Menerima props:
 * - isOpen: boolean, untuk mengontrol visibilitas modal
 * - onClose: function, untuk menutup modal
 * - voyageData: object, berisi { nama_kapal, voyage }
 * - onSaveSuccess: function, dipanggil setelah berhasil menyimpan
 */
function EditJadwalModal({ isOpen, onClose, voyageData, onSaveSuccess }) {
    const [jadwals, setJadwals] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fungsi untuk mengambil data jadwal dari API saat modal dibuka
    const fetchJadwal = useCallback(async () => {
        if (!voyageData?.nama_kapal || !voyageData?.voyage) return;

        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.get(`/jadwal/${voyageData.nama_kapal}/${voyageData.voyage}`);
            // Format tanggal dari database ke format yang bisa dibaca Day.js
            const formattedJadwals = response.data.map(j => ({
                ...j,
                waktu_tiba: j.waktu_tiba ? dayjs(j.waktu_tiba).format('YYYY-MM-DD HH:mm:ss') : null,
                waktu_berangkat: j.waktu_berangkat ? dayjs(j.waktu_berangkat).format('YYYY-MM-DD HH:mm:ss') : null,
            }));
            setJadwals(formattedJadwals);
        } catch (err) {
            setError('Gagal memuat data jadwal. ' + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    }, [voyageData]);

    useEffect(() => {
        if (isOpen) {
            fetchJadwal();
        }
    }, [isOpen, fetchJadwal]);

    // Fungsi inti untuk kalkulasi ulang jadwal secara berantai
    const recalculateSchedules = (updatedJadwals, startIndex) => {
        for (let i = startIndex; i < updatedJadwals.length; i++) {
            // Lewati baris pertama (pelabuhan awal), karena ETA-nya tidak dihitung dari baris sebelumnya
            if (i > 0) {
                const prevETD = dayjs(updatedJadwals[i - 1].waktu_berangkat);
                const { jarak, kecepatan, faktor_pasang_surut } = updatedJadwals[i];

                if (jarak !== null && kecepatan !== null && faktor_pasang_surut !== null && prevETD.isValid()) {
                    // 1. Hitung Waktu Layar & Jam Layar (dalam jam)
                    const waktuLayar = jarak / kecepatan;
                    const jamLayar = waktuLayar + parseFloat(faktor_pasang_surut);

                    // 2. Hitung ETA baru
                    const newETA = prevETD.add(jamLayar, 'hour');
                    updatedJadwals[i].waktu_tiba = newETA.format('YYYY-MM-DD HH:mm:ss');
                }
            }

            // 3. Hitung ETD baru dari ETA yang mungkin baru saja diperbarui
            const currentETA = dayjs(updatedJadwals[i].waktu_tiba);
            const { jam_labuh } = updatedJadwals[i];

            if (jam_labuh !== null && currentETA.isValid()) {
                const newETD = currentETA.add(parseFloat(jam_labuh), 'hour');
                updatedJadwals[i].waktu_berangkat = newETD.format('YYYY-MM-DD HH:mm:ss');
            }
        }
        return updatedJadwals;
    };

    // Handler saat nilai input di tabel diubah
    const handleInputChange = (index, field, value) => {
        const newJadwals = [...jadwals];
        newJadwals[index][field] = value;

        // Panggil fungsi kalkulasi ulang mulai dari index yang diubah
        const recalculated = recalculateSchedules(newJadwals, index);
        setJadwals(recalculated);
    };

    // Handler untuk menyimpan perubahan ke API
    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        // Siapkan payload, hanya kirim data yang dibutuhkan backend untuk update
        const payload = {
            nama_kapal: voyageData.nama_kapal,
            voyage: voyageData.voyage,
            jadwals: jadwals.map(j => ({
                id: j.id,
                waktu_tiba: j.waktu_tiba,
                waktu_berangkat: j.waktu_berangkat,
                // Kirim juga nilai yang diedit jika backend perlu menyimpannya
                faktor_pasang_surut: j.faktor_pasang_surut,
                jam_labuh: j.jam_labuh,
            }))
        };
        
        try {
            // Asumsi endpoint update Anda adalah PUT /api/jadwal/update
            const response = await api.put('/jadwal/update', payload);
            setSuccess(response.data.message);
            // Panggil callback setelah berhasil untuk merefresh data di halaman utama
            if(onSaveSuccess) {
                onSaveSuccess();
            }
            // Tutup modal setelah beberapa saat
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            setError('Gagal menyimpan perubahan. ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSaving(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Edit Jadwal: {voyageData.nama_kapal} - Voyage {voyageData.voyage}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>

                {isLoading && <p>Memuat data...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {success && <p className="text-green-500">{success}</p>}
                
                {!isLoading && !error && (
                    <div className="overflow-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pelabuhan</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ETA</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ETD</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jarak</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Faktor Pasang Surut</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam Labuh</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {jadwals.map((jadwal, index) => (
                                    <tr key={jadwal.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">{jadwal.pelabuhan}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{dayjs(jadwal.waktu_tiba).format('DD-MMM-YY HH:mm')}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{jadwal.waktu_berangkat ? dayjs(jadwal.waktu_berangkat).format('DD-MMM-YY HH:mm') : 'N/A'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{jadwal.jarak}</td>
                                        <td className="px-4 py-2">
                                            <input 
                                                type="number"
                                                value={jadwal.faktor_pasang_surut || ''}
                                                onChange={(e) => handleInputChange(index, 'faktor_pasang_surut', e.target.value)}
                                                className="w-20 p-1 border rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input 
                                                type="number"
                                                value={jadwal.jam_labuh || ''}
                                                onChange={(e) => handleInputChange(index, 'jam_labuh', e.target.value)}
                                                className="w-20 p-1 border rounded"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 text-right">
                    <button onClick={onClose} className="mr-4 py-2 px-4 border rounded hover:bg-gray-100">Batal</button>
                    <button 
                        onClick={handleSaveChanges}
                        disabled={isSaving || isLoading}
                        className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditJadwalModal;