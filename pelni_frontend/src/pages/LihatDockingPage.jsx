// file: pelni_frontend/src/pages/LihatDockingPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ConfirmationModal from '../components/ConfirmationModal';

function LihatDockingPage() {
    // State management
    const [dockingData, setDockingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // State untuk modal konfirmasi penghapusan
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Fungsi untuk mengambil data dari backend
    const fetchData = async () => {
        setLoading(true);
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await api.get('/docking', {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Urutkan data berdasarkan tanggal mulai docking terbaru
            const sortedData = response.data.sort((a, b) => new Date(b.waktu_mulai_docking) - new Date(a.waktu_mulai_docking));
            setDockingData(sortedData);
        } catch (err) {
            console.error('Gagal mengambil data docking:', err);
            setError('Gagal mengambil data dari server.');
        } finally {
            setLoading(false);
        }
    };

    // Panggil fetchData saat komponen pertama kali dimuat
    useEffect(() => {
        fetchData();
    }, [navigate]);

    // Fungsi untuk membuka modal hapus
    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    // Fungsi untuk mengonfirmasi dan menjalankan penghapusan
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        
        const token = sessionStorage.getItem('authToken');
        try {
            await api.delete(`/docking/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Jadwal docking berhasil dihapus.');
            // Ambil ulang data untuk memperbarui daftar
            fetchData(); 
        } catch (err) {
            console.error('Gagal menghapus data docking:', err);
            alert('Terjadi kesalahan saat menghapus data.');
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    // Helper untuk format tanggal
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    };

    if (loading) return <div className="text-center p-8">Memuat data...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold mb-6">Jadwal Docking Kapal</h1>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kapal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mulai Docking</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selesai Docking</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dockingData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Tidak ada data docking yang tersedia.
                                    </td>
                                </tr>
                            ) : (
                                dockingData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama_kapal}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.waktu_mulai_docking)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.waktu_selesai_docking)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.detail_docking}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-yellow-600 hover:text-yellow-800 mr-4" disabled>Edit</button>
                                            <button onClick={() => handleDeleteClick(item)} className="text-red-600 hover:text-red-800">
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Konfirmasi Hapus */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Konfirmasi Hapus"
            >
                <p>
                    Anda yakin ingin menghapus jadwal docking untuk kapal <span className="font-bold">{itemToDelete?.nama_kapal}</span>?
                </p>
            </ConfirmationModal>
        </>
    );
}

export default LihatDockingPage;