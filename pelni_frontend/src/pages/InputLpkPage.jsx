import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function InputLpkPage() {
    // STATE VARIABLE
    const [namaKapal, setNamaKapal] = useState('');
    const [voyage, setVoyage] = useState('');
    const [initialWaktuTiba, setInitialWaktuTiba] = useState('');
    const [lpkData, setLpkData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        if (!voyage || !namaKapal || !lpkData || !initialWaktuTiba) {
            alert("Silakan isi semua field, termasuk Waktu Tiba Awal.");
            setIsLoading(false);
            return;
        }

        const token = sessionStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            await api.post(
                '/lpk',
                {
                    nama_kapal: namaKapal,
                    voyage: voyage,
                    initial_waktu_tiba: initialWaktuTiba,
                    lpk_data: lpkData,
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setSuccess('Data LPK berhasil disimpan!');
            setNamaKapal('');
            setVoyage('');
            setInitialWaktuTiba('');
            setLpkData('');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-center mb-6">
                Input Data LPK
            </h1>

            {success && (
                <div
                    className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md mb-6"
                    role="alert"
                >
                    {success}
                </div>
            )}
            {error && (
                <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md mb-6"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ++ UPDATE GRID TO ACCOMMODATE THE NEW FIELD ++ */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <div>
                            <label
                                htmlFor="voyage"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Voyage Ke-
                            </label>
                            <input
                                type="text"
                                id="voyage"
                                value={voyage}
                                onChange={(e) => setVoyage(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Contoh: 07"
                            />
                        </div>
                        {/* ++ ADD THE NEW DATETIME INPUT FIELD ++ */}
                        <div>
                            <label
                                htmlFor="initial_waktu_tiba"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Waktu Tiba Awal
                            </label>
                            <input
                                type="datetime-local"
                                id="initial_waktu_tiba"
                                value={initialWaktuTiba}
                                onChange={(e) => setInitialWaktuTiba(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="lpk_data"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Data LPK (Paste dari Excel)
                        </label>
                        <textarea
                            id="lpk_data"
                            rows={15}
                            value={lpkData}
                            onChange={(e) => setLpkData(e.target.value)}
                            className="mt-1 h-80 w-full rounded-md border border-gray-300 p-4 font-mono shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder={`Contoh:\nTg. Priok Tg. Pandan 25-Apr-25 8:33 26-Apr-25 1:03 30 16:30 199 12.1`}
                            required
                        ></textarea>
                    </div>

                    <div className="text-right">
                        <button
                            type="submit"
                            disabled={isLoading}
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

export default InputLpkPage;