// pelni_frontend/src/components/UpdatePlanModal.jsx

import { useState, useEffect } from 'react';
import api from '../api';

// (PERUBAHAN DI SINI) Fungsi helper untuk memformat tanggal menggunakan UTC
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    // Gunakan getUTC...() untuk menghindari konversi timezone lokal
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth() juga 0-indexed
    const year = String(date.getUTCFullYear()).slice(-2);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};


function UpdatePlanModal({ isOpen, onClose, kapalList, allJadwal, initialData }) {
    const [selectedKapal, setSelectedKapal] = useState('');
    const [selectedVoyage, setSelectedVoyage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [availableVoyages, setAvailableVoyages] = useState([]);

    useEffect(() => {
        // Jika modal dibuka dan ada data awal
        if (isOpen && initialData) {
            setSelectedKapal(initialData.namaKapal);
            setSelectedVoyage(initialData.voyage);
        }
        // Reset saat modal ditutup
        if (!isOpen) {
            setSelectedKapal('');
            setSelectedVoyage('');
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (selectedKapal && allJadwal) {
            // Filter jadwal untuk kapal yang dipilih
            const jadwalForKapal = allJadwal.filter(item => item.nama_kapal === selectedKapal);

            // Kelompokkan jadwal berdasarkan voyage
            const voyagesMap = jadwalForKapal.reduce((acc, item) => {
                if (!acc[item.voyage]) {
                    acc[item.voyage] = [];
                }
                acc[item.voyage].push(item);
                return acc;
            }, {});

            // Ambil waktu TIBA di pelabuhan awal dan akhir
            const voyagesWithDates = Object.keys(voyagesMap).map(voyage => {
                const voyageSchedules = voyagesMap[voyage];

                if (voyageSchedules.length === 0) {
                    return null;
                }

                const firstStop = voyageSchedules[0];
                const lastStop = voyageSchedules[voyageSchedules.length - 1];

                return {
                    voyage: voyage,
                    start: formatDate(firstStop.waktu_tiba),
                    end: formatDate(lastStop.waktu_tiba),
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.voyage - b.voyage);

            setAvailableVoyages(voyagesWithDates);
            setSelectedVoyage('');
        } else {
            setAvailableVoyages([]);
        }
    }, [selectedKapal, allJadwal]);


    const handleSubmit = async () => {
        if (!selectedKapal || !selectedVoyage) {
            alert('Silakan pilih kapal dan voyage terlebih dahulu.');
            return;
        }
        setIsLoading(true);
        try {
            const token = sessionStorage.getItem('authToken');
            await api.post('/plan-public/publish',
                { nama_kapal: selectedKapal, voyage: selectedVoyage },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            alert('Berhasil mengupdate Plan!');
            onClose();
        } catch (error) {
            console.error('Gagal mem-publish plan:', error);
            alert('Gagal, terjadi kesalahan.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Update ke Plan Public</h3>
                <div className="space-y-4">
                    {/* Dropdown Kapal (tidak ada perubahan) */}
                    <select value={selectedKapal} onChange={e => setSelectedKapal(e.target.value)} className="w-full p-2 border rounded bg-white">
                        <option value="" disabled>-- Pilih Kapal --</option>
                        {kapalList.map(kapal => <option key={kapal} value={kapal}>{kapal}</option>)}
                    </select>

                    {/* (PERUBAHAN DI SINI) Dropdown Voyage dengan style disabled */}
                    <select
                        value={selectedVoyage}
                        onChange={e => setSelectedVoyage(e.target.value)}
                        className="w-full p-2 border rounded bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
                        disabled={!selectedKapal}
                    >
                        <option value="" disabled>-- Pilih Voyage --</option>
                        {availableVoyages.map(v => (
                            <option key={v.voyage} value={v.voyage}>
                                Voyage {v.voyage} ({v.start} - {v.end})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <button onClick={handleSubmit} disabled={isLoading || !selectedVoyage} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                        {isLoading ? 'Menyimpan...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
export default UpdatePlanModal;