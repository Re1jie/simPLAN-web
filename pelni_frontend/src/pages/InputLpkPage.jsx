import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api'; // Pastikan path ini benar

function InputLpkPage() {
    // State disamakan dengan InputJadwalPage, tapi disesuaikan untuk LPK
    const [namaKapal, setNamaKapal] = useState('');
    const [voyage, setVoyage] = useState('');
    const [lpkData, setLpkData] = useState(''); // Menggantikan dataJadwal
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Panggil endpoint '/lpk' sesuai dengan routes API Anda
            const response = await api.post('/lpk', {
                nama_kapal: namaKapal, // Sesuaikan dengan nama field di controller
                voyage: voyage,
                lpk_data: lpkData,     // Sesuaikan dengan nama field di controller
            });

            setSuccess(response.data.message || 'Data LPK berhasil disimpan!');
            
            // Kosongkan form setelah berhasil
            setNamaKapal('');
            setVoyage('');
            setLpkData('');

        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6">
                <h1 className="text-2xl font-bold mb-6">Input Data LPK (Laporan Posisi Kapal)</h1>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    {success && (
                        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label htmlFor="nama_kapal" className="block text-gray-700 text-sm font-bold mb-2">Nama Kapal</label>
                                <input
                                    type="text"
                                    id="nama_kapal"
                                    value={namaKapal}
                                    onChange={(e) => setNamaKapal(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="voyage" className="block text-gray-700 text-sm font-bold mb-2">Voyage</label>
                                <input
                                    type="text"
                                    id="voyage"
                                    value={voyage}
                                    onChange={(e) => setVoyage(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="lpk_data" className="block text-gray-700 text-sm font-bold mb-2">
                                Data LPK (Paste dari Excel)
                            </label>
                            <textarea
                                id="lpk_data"
                                rows="15"
                                value={lpkData}
                                onChange={(e) => setLpkData(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono"
                                placeholder="Contoh:&#10;Tg. Priok Tg. Pandan 25-Apr-25 8:33 26-Apr-25 1:03 30 16:30 199 12.1"
                                required
                            ></textarea>
                        </div>

                        <div className="flex items-center justify-start">
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default InputLpkPage;