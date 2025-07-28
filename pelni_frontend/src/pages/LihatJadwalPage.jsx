import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function LihatJadwalPage() {
    // STATE
    const [allJadwal, setAllJadwal] = useState([]);
    const [filteredJadwal, setFilteredJadwal] = useState([]);
    const [groupedJadwal, setGroupedJadwal] = useState([]);
    const [voyageList, setVoyageList] = useState([]);
    const [kapalList, setKapalList] = useState([]);
    const [selectedVoyage, setSelectedVoyage] = useState('');
    const [selectedKapal, setSelectedKapal] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // LOGIKA FILTER
    useEffect(() => {
        let result = allJadwal;

        if (selectedVoyage) {
            result = result.filter(item => item.voyage == selectedVoyage);
        }

        if (selectedKapal) {
            result = result.filter(item => item.nama_kapal === selectedKapal);
        }

        setFilteredJadwal(result);
    }, [selectedVoyage, selectedKapal, allJadwal]); // Dijalankan jika salah satu state ini berubah

    useEffect(() => {
        const groupByKapalAndVoyage = (data) => {
            return data.reduce((acc, item) => {
                const key = `${item.nama_kapal}-${item.voyage}`;
                if (!acc[key]) {
                    acc[key] = {
                        nama_kapal: item.nama_kapal,
                        voyage: item.voyage,
                        rute: item.rute, // Ambil rute dari data
                        jadwal: []
                    };
                }
                acc[key].jadwal.push(item);
                return acc;
            }, {});
        };
        const grouped = groupByKapalAndVoyage(filteredJadwal);
        setGroupedJadwal(grouped);
    }, [filteredJadwal]);

    // Efek untuk mengambil data awal
    const fetchAllJadwal = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) { navigate('/login'); return; }
        setLoading(true); // Set loading di awal fetch
        try {
            const response = await api.get('/jadwal', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAllJadwal(response.data);
            // setFilteredJadwal(response.data); // Tidak perlu, karena akan ditangani oleh useEffect lain
            const uniqueVoyages = [...new Set(response.data.map(item => item.voyage))];
            const uniqueKapal = [...new Set(response.data.map(item => item.nama_kapal))];
            setVoyageList(uniqueVoyages.sort((a, b) => a - b));
            setKapalList(uniqueKapal.sort());
        } catch (err) {
            console.error("Gagal mengambil data jadwal:", err);
            setError('Gagal mengambil data dari server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVoyage = async (namaKapal, voyage) => {
        const isConfirmed = window.confirm(`Anda yakin ingin menghapus semua jadwal untuk ${namaKapal} VOYAGE ${voyage}?`);
        if (isConfirmed) {
            const token = localStorage.getItem('authToken');
            try {
                await api.delete('/jadwal/by-voyage', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    data: { nama_kapal: namaKapal, voyage: voyage }
                });
                alert('Jadwal voyage berhasil dihapus.');
                fetchAllJadwal(); // Ambil ulang data terbaru dari server
            } catch (err) {
                console.error("Gagal menghapus voyage:", err);
                alert("Terjadi kesalahan saat menghapus data.");
            }
        }
    };

    useEffect(() => {
        fetchAllJadwal();
    }, [navigate]);

    if (loading) { return <div className="text-center p-8">Memuat data jadwal...</div>; }
    if (error) { return <div className="text-center p-8 text-red-500">{error}</div>; }

    // TAMPILAN (JSX)
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Lihat Jadwal</h1>
                <div className="flex items-center space-x-4">
                    {/* Filter (tidak ada perubahan) */}
                    <div>
                        <label htmlFor="kapalFilter" className="mr-2 text-sm font-medium">Filter Kapal:</label>
                        <select id="kapalFilter" value={selectedKapal} onChange={(e) => setSelectedKapal(e.target.value)} className="rounded-md border-gray-300 shadow-sm">
                            <option value="">Semua Kapal</option>
                            {kapalList.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="voyageFilter" className="mr-2 text-sm font-medium">Filter Voyage:</label>
                        <select id="voyageFilter" value={selectedVoyage} onChange={(e) => setSelectedVoyage(e.target.value)} className="rounded-md border-gray-300 shadow-sm">
                            <option value="">Semua Voyage</option>
                            {voyageList.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* BARU: TAMPILAN BERDASARKAN GRUP */}
            <div className="space-y-6">
                {Object.keys(groupedJadwal).length === 0 && !loading ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <p>Belum ada data jadwal atau tidak ada data untuk filter yang dipilih.</p>
                    </div>
                ) : (
                    Object.values(groupedJadwal).map((group, groupIndex) => (
                        <div key={groupIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Header Bar per Grup */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-lg text-indigo-700">{group.nama_kapal}</span>
                                    <span className="text-sm bg-gray-200 text-gray-800 font-semibold px-2 py-1 rounded-full">VOYAGE {group.voyage}</span>
                                    {group.rute && (
                                        <span className="text-sm bg-green-200 text-green-800 font-semibold px-2 py-1 rounded-full">RUTE {group.rute}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="text-sm font-medium text-yellow-600 hover:text-yellow-800">Edit</button>
                                    <button onClick={() => handleDeleteVoyage(group.nama_kapal, group.voyage)} className="text-sm font-medium text-red-600 hover:red-800">Hapus</button>
                                </div>
                            </div>
                            {/* Daftar Jadwal per Grup */}
                            <ul className="divide-y divide-gray-200">
                                {group.jadwal.map((item, index) => (
                                    <li key={item.id} className="px-4 py-3 flex items-start space-x-4">
                                        <span className="w-8 pt-1 text-right font-medium text-gray-500">{index + 1}.</span>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                                            <p className="font-semibold text-gray-800">{item.pelabuhan}</p>
                                            <div className="text-sm text-gray-600">
                                                <span>
                                                    <span className="font-semibold">Tiba:</span> {new Date(item.waktu_tiba).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })}
                                                </span>
                                                <span className="mx-2">|</span>
                                                <span>
                                                    <span className="font-semibold">Berangkat:</span> {item.waktu_berangkat ? new Date(item.waktu_berangkat).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default LihatJadwalPage;