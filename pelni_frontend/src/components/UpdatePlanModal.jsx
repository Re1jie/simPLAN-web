import { useState } from 'react';
import api from '../api';

function UpdatePlanModal({ isOpen, onClose, kapalList, voyageList }) {
    const [selectedKapal, setSelectedKapal] = useState('');
    const [selectedVoyage, setSelectedVoyage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
            onClose(); // Tutup modal setelah berhasil
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
                    {/* Dropdown untuk Kapal */}
                    <select value={selectedKapal} onChange={e => setSelectedKapal(e.target.value)} className="w-full p-2 border rounded">
                        <option value="" disabled>-- Pilih Kapal --</option>
                        {kapalList.map(kapal => <option key={kapal} value={kapal}>{kapal}</option>)}
                    </select>
                    {/* Dropdown untuk Voyage */}
                    <select value={selectedVoyage} onChange={e => setSelectedVoyage(e.target.value)} className="w-full p-2 border rounded">
                        <option value="" disabled>-- Pilih Voyage --</option>
                        {voyageList.map(voyage => <option key={voyage} value={voyage}>{voyage}</option>)}
                    </select>
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                        {isLoading ? 'Menyimpan...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
export default UpdatePlanModal;