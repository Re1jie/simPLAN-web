import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ConfirmationModal from '../components/ConfirmationModal'; 
import { processJadwalData, findScheduleConflicts, parseJadwalText } from '../utils/jadwalUtils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import EditJadwalModal from '../components/EditJadwalModal';

const DAFTAR_KAPAL_LENGKAP = [
  "KM. AWU", "KM. BINAIYA", "KM. BUKIT RAYA", "KM. BUKIT SIGUNTANG", "KM. CIREMAI",
  "KM. DOBONSOLO", "KM. DOROLONDA", "KM. EGON", "KFC. JET LINER", "KM. KELIMUTU",
  "KM. KELUD", "KM. LABOBAR", "KM. LAMBELU", "KM. LAWIT", "KM. LEUSER",
  "KM. NGGAPULU", "KM. PANGRANGO", "KM. SANGIANG", "KM. SIRIMAU", "KM. SINABUNG",
  "KM. TATAMAILAU", "KM. TIDAR", "KM. TILONGKABILA", "KM. GUNUNG DEMPO", "KM. WILIS"
].sort();

function LihatJadwalPage() {
    // STATE
    const [allJadwal, setAllJadwal] = useState([]);
    const [filteredJadwal, setFilteredJadwal] = useState([]);
    const [groupedJadwal, setGroupedJadwal] = useState([]);
    const [kapalList, setKapalList] = useState([]);
    const [selectedVoyage, setSelectedVoyage] = useState('');
    const [selectedKapal, setSelectedKapal] = useState('');
    const [availableVoyages, setAvailableVoyages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // State untuk modal hapus
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [voyageToDelete, setVoyageToDelete] = useState(null);

    const [conflicts, setConflicts] = useState([]);

    // State untuk menyimpan data voyage yang akan di-update
    const [voyageToUpdate, setVoyageToUpdate] = useState(null);
    // State untuk visibility modal konfirmasi update
    const [isUpdateConfirmModalOpen, setUpdateConfirmModalOpen] = useState(false);

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [voyageToEdit, setVoyageToEdit] = useState(null);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    const openEditModal = (namaKapal, voyage, rute) => {
        setVoyageToEdit({ namaKapal, voyage, rute });
        setEditModalOpen(true);
    };

    const confirmEditJadwal = async (rawText) => {
        if (!voyageToEdit) return;
        setIsSubmittingEdit(true);
        const { namaKapal, voyage, rute } = voyageToEdit;
        
        const hasilParsing = parseJadwalText(rawText);
        if (hasilParsing.length === 0) {
            alert("Tidak ada data valid yang bisa diproses.");
            setIsSubmittingEdit(false);
            return;
        }

        const token = sessionStorage.getItem('authToken');
        try {
            // Kita menggunakan endpoint yang sama dengan InputJadwalPage
            // karena logikanya (hapus lama, buat baru) sama dengan "overwrite"
            await api.post('/jadwal/batch', {
                voyage,
                nama_kapal: namaKapal,
                rute,
                jadwal: hasilParsing,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Jadwal berhasil diperbarui!');
            setEditModalOpen(false);
            setVoyageToEdit(null);
            fetchAllJadwal(); // Ambil ulang data untuk refresh tampilan

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Gagal menyimpan perubahan.';
            alert(errorMessage);
            console.error(err);
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    // Membuka modal konfirmasi update ---
    const openUpdateConfirmModal = (namaKapal, voyage) => {
        setVoyageToUpdate({ namaKapal, voyage });
        setUpdateConfirmModalOpen(true);
    };

    // Menjalankan update setelah dikonfirmasi ---
    const confirmUpdateToPlan = async () => {
        if (!voyageToUpdate) return;
        const { namaKapal, voyage } = voyageToUpdate;
        const token = sessionStorage.getItem('authToken');

        try {
            await api.post('/plan-public/publish',
                { nama_kapal: namaKapal, voyage: voyage },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            alert('Voyage berhasil di-update ke Plan Public.');
        } catch (err) {
            console.error('Gagal update plan public:', err);
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saat mengupdate plan.';
            alert(errorMessage);
        } finally {
            setUpdateConfirmModalOpen(false);
            setVoyageToUpdate(null);
        }
    };

    // LOGIKA FILTER
    useEffect(() => {
        let result = allJadwal;
        if (selectedVoyage) result = result.filter((item) => item.voyage == selectedVoyage);
        if (selectedKapal) result = result.filter((item) => item.nama_kapal === selectedKapal);
        setFilteredJadwal(result);
    }, [selectedVoyage, selectedKapal, allJadwal]);

    // UPDATE VOYAGE LIST BERDASARKAN KAPAL
    useEffect(() => {
        if (selectedKapal) {
            const voyagesForSelectedKapal = allJadwal
                .filter(item => item.nama_kapal === selectedKapal)
                .map(item => item.voyage);
            const uniqueVoyages = [...new Set(voyagesForSelectedKapal)];
            setAvailableVoyages(uniqueVoyages.sort((a, b) => a - b));
        } else {
            setAvailableVoyages([]);
        }
        setSelectedVoyage('');
    }, [selectedKapal, allJadwal]);

    // Grup data berdasarkan kapal & voyage
    useEffect(() => {
        const groupByKapalAndVoyage = (data) => data.reduce((acc, item) => {
            const key = `${item.nama_kapal}-${item.voyage}`;
            if (!acc[key]) {
                acc[key] = {
                    nama_kapal: item.nama_kapal,
                    voyage: item.voyage,
                    rute: item.rute,
                    jadwal: [],
                };
            }
            acc[key].jadwal.push(item);
            return acc;
        }, {});
        const grouped = groupByKapalAndVoyage(filteredJadwal);
        setGroupedJadwal(grouped);
    }, [filteredJadwal]);

    // Ambil data awal
    const fetchAllJadwal = async () => {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
        setLoading(true);
        try {
            const response = await api.get('/jadwal', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const fetchedJadwal = response.data;
            setAllJadwal(fetchedJadwal);
            const uniqueKapal = [...new Set(fetchedJadwal.map((item) => item.nama_kapal))];
            if (fetchedJadwal.length > 0) {
                const { dataMatriks } = processJadwalData(fetchedJadwal, DAFTAR_KAPAL_LENGKAP);
                const foundConflicts = findScheduleConflicts(dataMatriks);
                setConflicts(foundConflicts);
            }
            setKapalList(uniqueKapal.sort());
        } catch (err) {
            setError('Gagal mengambil data dari server.');
        } finally {
            setLoading(false);
        }
    };

    const findConflictsForItem = (jadwalItem) => {
        const dateKey = format(new Date(jadwalItem.waktu_tiba), 'dd-MMM-yy', { locale: id });
        const relevantConflict = conflicts.find(c =>
            c.date === dateKey &&
            c.port === jadwalItem.pelabuhan &&
            c.kapal.includes(jadwalItem.nama_kapal)
        );
        // Jika tidak ada konflik, kembalikan objek kosong
        if (!relevantConflict) {
            return { conflicts: [], conflictDate: null };
        }

        // Filter untuk mendapatkan kapal lain yang bentrok
        const otherConflicts = relevantConflict.kapal
            .map((kapal, index) => ({ kapal, waktu: relevantConflict.waktu[index] }))
            .filter(c => c.kapal !== jadwalItem.nama_kapal);

        // Kembalikan daftar konflik DAN tanggalnya
        return {
            conflicts: otherConflicts,
            conflictDate: relevantConflict.date // formatnya sudah 'dd-MMM-yy'
        };
    };

    // Fungsi Hapus
    const openDeleteModal = (namaKapal, voyage) => {
        setVoyageToDelete({ namaKapal, voyage });
        setDeleteModalOpen(true);
    };
    const confirmDeleteVoyage = async () => {
        if (!voyageToDelete) return;
        const { namaKapal, voyage } = voyageToDelete;
        const token = sessionStorage.getItem('authToken');
        try {
            await api.delete('/jadwal/by-voyage', {
                headers: { Authorization: `Bearer ${token}` },
                data: { nama_kapal: namaKapal, voyage },
            });
            alert('Jadwal voyage berhasil dihapus.');
            fetchAllJadwal();
        } catch (err) {
            alert('Terjadi kesalahan saat menghapus data.');
        } finally {
            setDeleteModalOpen(false);
            setVoyageToDelete(null);
        }
    };

    useEffect(() => {
        fetchAllJadwal();
    }, [navigate]);

    if (loading) return <div className="text-center p-8">Memuat data jadwal...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    // TAMPILAN
    return (
        <>
            <div>
                {/* Bagian Filter */}
                <div className="flex justify-center items-center mb-6">
                    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md">
                        <div>
                            <label htmlFor="kapalFilter" className="mr-2 text-sm font-medium">Filter Kapal:</label>
                            <select id="kapalFilter" value={selectedKapal} onChange={(e) => setSelectedKapal(e.target.value)} className="rounded-md border-gray-300 shadow-sm">
                                <option value="">-- Pilih Kapal --</option>
                                {kapalList.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="voyageFilter" className="mr-2 text-sm font-medium">Filter Voyage:</label>
                            <select id="voyageFilter" value={selectedVoyage} onChange={(e) => setSelectedVoyage(e.target.value)} disabled={!selectedKapal} className="rounded-md border-gray-300 shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed">
                                <option value="">Semua Voyage</option>
                                {availableVoyages.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Daftar Jadwal */}
                <div className="space-y-6">
                    {Object.keys(groupedJadwal).length === 0 && !loading ? (
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <p>Belum ada data jadwal atau tidak ada data untuk filter yang dipilih.</p>
                        </div>
                    ) : (
                        Object.values(groupedJadwal).map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
                                {/* Header Grup */}
                                <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                                    {/* ... Info Kapal ... */}
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-lg text-indigo-700">{group.nama_kapal}</span>
                                        <span className="text-sm bg-gray-200 text-gray-800 font-semibold px-2 py-1 rounded-full">VOYAGE {group.voyage}</span>
                                        {group.rute && <span className="text-sm bg-green-200 text-green-800 font-semibold px-2 py-1 rounded-full">RUTE {group.rute}</span>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* --- PERUBAHAN ONCLICK TOMBOL UPDATE --- */}
                                        <button
                                            onClick={() => openUpdateConfirmModal(group.nama_kapal, group.voyage)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            Update ke Plan
                                        </button>
                                        <button 
                                            onClick={() => openEditModal(group.nama_kapal, group.voyage, group.rute)} 
                                            className="text-sm font-medium text-yellow-600 hover:text-yellow-800"
                                        >
                                            Edit
                                        </button>
                                        <button onClick={() => openDeleteModal(group.nama_kapal, group.voyage)} className="text-sm font-medium text-red-600 hover:text-red-800">
                                            Hapus
                                        </button>
                                    </div>
                                </div>

                                {/* Isi Jadwal */}
                                <ul className="divide-y divide-gray-200">
                                    {group.jadwal.map((item, index) => {
                                        const { conflicts: itemConflicts, conflictDate } = findConflictsForItem(item);
                                        return (
                                            <li key={item.id} className="px-4 py-3 flex items-center space-x-4">
                                                <span className="w-8 pt-1 text-right font-medium text-gray-500">{index + 1}.</span>
                                                <div className="flex flex-1 items-center">
                                                    <div className="w-1/3 text-left">
                                                        <p className="font-semibold text-gray-800">{item.pelabuhan}</p>
                                                    </div>
                                                    <div className="flex-1 text-sm text-gray-600 text-center">
                                                        <span><span className="font-semibold">Tiba:</span>{' '}{new Date(item.waktu_tiba).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}</span>
                                                        <span className="mx-2">|</span>
                                                        <span><span className="font-semibold">Berangkat:</span>{' '}{item.waktu_berangkat ? new Date(item.waktu_berangkat).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) : 'N/A'}</span>
                                                    </div>
                                                    <div className="w-1/3 flex justify-end">
                                                        {itemConflicts.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                {itemConflicts.map((konflik, idx) =>
                                                                <span key={idx} className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-1 rounded-md">
                                                                    [{conflictDate.substring(0, 2)}] {konflik.kapal} ({konflik.waktu})
                                                                </span>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Konfirmasi Hapus */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteVoyage}
                title="Konfirmasi Hapus Jadwal"
                confirmText="Ya, Hapus"
            >
                <p>
                    Apakah Anda yakin ingin menghapus semua jadwal untuk{' '}
                    <span className="font-bold">{voyageToDelete?.namaKapal}</span> VOYAGE{' '}
                    <span className="font-bold">{voyageToDelete?.voyage}</span>?
                </p>
            </ConfirmationModal>

            {/* Konfirmasi Update Plan */}
            <ConfirmationModal
                isOpen={isUpdateConfirmModalOpen}
                onClose={() => setUpdateConfirmModalOpen(false)}
                onConfirm={confirmUpdateToPlan}
                title="Konfirmasi Update Plan Public"
                confirmText="Ya, Lanjutkan"
                // Tambahkan prop ini untuk mengubah warna tombol menjadi biru
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
            >
                <p>
                    Apakah Anda yakin untuk mengupdate jadwal{' '}
                    <span className="font-bold">{voyageToUpdate?.namaKapal}</span> VOYAGE{' '}
                    <span className="font-bold">{voyageToUpdate?.voyage}</span> ke Plan Public?
                </p>
            </ConfirmationModal>

            <EditJadwalModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                onConfirm={confirmEditJadwal}
                voyageData={voyageToEdit}
                isLoading={isSubmittingEdit}
            />
        </>
    );
}

export default LihatJadwalPage;