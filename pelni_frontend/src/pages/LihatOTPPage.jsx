// src/pages/LihatOTPPage.jsx

import { useState, useEffect } from 'react';
import api from '../api';

function LihatOTPPage() {
    // State management
    const [kapalList, setKapalList] = useState([]);
    const [voyageList, setVoyageList] = useState([]);
    const [selectedKapal, setSelectedKapal] = useState('');
    const [selectedVoyage, setSelectedVoyage] = useState('');
    const [otpData, setOtpData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Mengambil daftar kapal dan voyage unik saat komponen dimuat
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = sessionStorage.getItem('authToken');
                const response = await api.get('/jadwal', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const uniqueKapal = [...new Set(response.data.map(item => item.nama_kapal))].sort();
                setKapalList(uniqueKapal);
                // Simpan semua jadwal untuk filtering voyage nanti
                localStorage.setItem('allJadwal', JSON.stringify(response.data));
            } catch (err) {
                console.error("Gagal memuat data awal:", err);
            }
        };
        fetchInitialData();
    }, []);

    // Memperbarui daftar voyage saat kapal dipilih
    useEffect(() => {
        if (selectedKapal) {
            const allJadwal = JSON.parse(localStorage.getItem('allJadwal')) || [];
            const voyages = [...new Set(allJadwal.filter(j => j.nama_kapal === selectedKapal).map(item => item.voyage))].sort((a, b) => a - b);
            setVoyageList(voyages);
            setSelectedVoyage('');
            setOtpData(null);
        } else {
            setVoyageList([]);
        }
    }, [selectedKapal]);
    
    // Fungsi untuk mengambil dan menampilkan data OTP
    const handleFetchOtp = async () => {
        if (!selectedKapal || !selectedVoyage) {
            alert('Pilih kapal dan voyage terlebih dahulu.');
            return;
        }
        setLoading(true);
        setError('');
        setOtpData(null);
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await api.get(`/otp/${selectedKapal}/${selectedVoyage}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOtpData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengambil data OTP.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper untuk format tanggal
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
        });
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-center mb-6">On-Time Performance (OTP)</h1>

            {/* Filter Section */}
            <div className="flex justify-center items-center mb-6 p-4 bg-white rounded-lg shadow-md space-x-4">
                <select value={selectedKapal} onChange={e => setSelectedKapal(e.target.value)} className="rounded-md border-gray-300">
                    <option value="">-- Pilih Kapal --</option>
                    {kapalList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <select value={selectedVoyage} onChange={e => setSelectedVoyage(e.target.value)} disabled={!selectedKapal} className="rounded-md border-gray-300 disabled:bg-gray-200">
                    <option value="">-- Pilih Voyage --</option>
                    {voyageList.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <button onClick={handleFetchOtp} disabled={loading || !selectedVoyage} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Memuat...' : 'Tampilkan'}
                </button>
            </div>

            {/* Data Display Section */}
            {error && <p className="text-center text-red-500">{error}</p>}
            {otpData && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">No</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Pelabuhan</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">ETA</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">TA</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">ETD</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">TD</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">%OTP TA</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">%OTP TD</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {otpData.otp_data.map((row, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 text-center">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium">{row.pelabuhan}</td>
                                    <td className="px-4 py-3">{formatDateTime(row.eta)}</td>
                                    <td className="px-4 py-3">{formatDateTime(row.ta)}</td>
                                    <td className="px-4 py-3">{formatDateTime(row.etd)}</td>
                                    <td className="px-4 py-3">{formatDateTime(row.td)}</td>
                                    <td className="px-4 py-3 text-center font-bold">{row.otp_ta}%</td>
                                    <td className="px-4 py-3 text-center font-bold">{row.otp_td !== null ? `${row.otp_td}%` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 bg-gray-50 text-right font-bold text-lg">
                        Rata-Rata OTP: <span className="text-blue-600">{otpData.average_otp}%</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LihatOTPPage;