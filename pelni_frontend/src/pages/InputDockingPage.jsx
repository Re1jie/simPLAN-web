import { useState } from 'react';
import api from '../api';

const DAFTAR_KAPAL = [
  "KM. AWU",
  "KM. BINAIYA",
  "KM. BUKIT RAYA",
  "KM. BUKIT SIGUNTANG",
  "KM. CIREMAI",
  "KM. DOBONSOLO",
  "KM. DOROLONDA",
  "KM. EGON",
  "KFC. JET LINER",
  "KM. KELIMUTU",
  "KM. KELUD",
  "KM. LABOBAR",
  "KM. LAMBELU",
  "KM. LAWIT",
  "KM. LEUSER",
  "KM. NGGAPULU",
  "KM. PANGRANGO",
  "KM. SANGIANG",
  "KM. SIRIMAU",
  "KM. SINABUNG",
  "KM. TATAMAILAU",
  "KM. TIDAR",
  "KM. TILONGKABILA",
  "KM. GUNUNG DEMPO",
  "KM. WILIS"
];

function InputDockingPage() {

    // STATE
    const [namaKapal, setNamaKapal] = useState('');
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [detailDocking, setDetailDocking] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        if (!namaKapal || !startDateTime || !endDateTime || !detailDocking) {
            setError('Semua field wajib diisi.');
            setIsLoading(false);
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            await api.post('/docking', {
                nama_kapal: namaKapal,
                waktu_mulai_docking: startDateTime,
                waktu_selesai_docking: endDateTime,
                detail_docking: detailDocking,
            }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            setMessage('Periode docking berhasil disimpan!');

            // Kosongkan form setelah berhasil
            setNamaKapal('');
            setStartDateTime('');
            setEndDateTime('');
            setDetailDocking('');

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormInvalid = !namaKapal || !startDateTime || !endDateTime || !detailDocking;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Input Periode Docking</h1>

            {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md mb-6" role="alert">
                    {message}
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md mb-6" role="alert">
                    {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="nama_kapal" className="block text-sm font-medium text-gray-700">Nama Kapal</label>
                        <select
                            id="nama_kapal" value={namaKapal} onChange={(e) => setNamaKapal(e.target.value)}
                            required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="" disabled>-- Pilih Kapal --</option>
                            {DAFTAR_KAPAL.map(kapal => <option key={kapal} value={kapal}>{kapal}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700">Waktu Mulai Docking</label>
                            <input
                                type="date" id="start_datetime" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required
                            />
                        </div>
                        <div>
                            <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700">Waktu Selesai Docking</label>
                            <input
                                type="date" id="end_datetime" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="detail_docking" className="block text-sm font-medium text-gray-700">Detail Docking</label>
                        <input
                            type="text" id="detail_docking" value={detailDocking} onChange={(e) => setDetailDocking(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Contoh: DOCKING DI PT. PAL SURABAYA" required
                        />
                    </div>

                    <div className="text-right">
                        <button
                            type="submit"
                            disabled={isLoading || isFormInvalid}
                            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default InputDockingPage;