import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; // Import locale Indonesia
import EditJadwalModal from '../components/EditJadwalModal'; // <-- 1. IMPORT MODAL

dayjs.locale('id'); // Set locale Day.js ke Indonesia

function LihatJadwalPage() {
    const [jadwals, setJadwals] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // <-- 2. STATE UNTUK MENGONTROL MODAL -->
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVoyage, setSelectedVoyage] = useState(null);

    const fetchJadwals = async () => {
        try {
            const response = await api.get('/jadwal');
            const grouped = response.data.reduce((acc, curr) => {
                const key = `${curr.nama_kapal}-${curr.voyage}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(curr);
                return acc;
            }, {});
            setJadwals(grouped);
        } catch (err) {
            setError('Gagal memuat data jadwal.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJadwals();
    }, []);

    // <-- 3. FUNGSI-FUNGSI UNTUK MENGELOLA MODAL -->

    /**
     * Membuka modal edit dan mengirimkan data kapal & voyage yang dipilih.
     * @param {string} key - Kunci grup, contoh: "KM. AWU-1"
     */
    const handleOpenEditModal = (key) => {
        const [nama_kapal, voyage] = key.split('-');
        setSelectedVoyage({ nama_kapal, voyage });
        setIsModalOpen(true);
    };

    /**
     * Menutup modal edit.
     */
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedVoyage(null);
    };

    /**
     * Callback yang dipanggil setelah data berhasil disimpan di modal.
     * Ini akan me-refresh data di halaman ini.
     */
    const handleSaveSuccess = () => {
        fetchJadwals(); // Panggil lagi fungsi fetch untuk mendapatkan data terbaru
    };


    if (isLoading) return <div className="text-center mt-10">Memuat data...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Lihat Semua Jadwal</h1>
            <div className="space-y-8">
                {Object.keys(jadwals).map(key => {
                    const jadwalGroup = jadwals[key];
                    const { nama_kapal, voyage } = jadwalGroup[0];

                    return (
                        <div key={key} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">{nama_kapal} - Voyage {voyage}</h2>
                                <div>
                                    {/* <-- 4. TAMBAHKAN ONCLICK PADA TOMBOL EDIT --> */}
                                    <button
                                        onClick={() => handleOpenEditModal(key)}
                                        className="text-blue-500 hover:underline mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button className="text-red-500 hover:underline">Hapus</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelabuhan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Tiba (ETA)</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Berangkat (ETD)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {jadwalGroup.map(jadwal => (
                                            <tr key={jadwal.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">{jadwal.pelabuhan}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {dayjs(jadwal.waktu_tiba).format('dddd, DD MMMM YYYY - HH:mm')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {jadwal.waktu_berangkat ? dayjs(jadwal.waktu_berangkat).format('dddd, DD MMMM YYYY - HH:mm') : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* <-- 5. RENDER KOMPONEN MODAL DI SINI --> */}
            <EditJadwalModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                voyageData={selectedVoyage}
                onSaveSuccess={handleSaveSuccess}
            />
        </div>
    );
}

export default LihatJadwalPage;