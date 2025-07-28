import { useState } from 'react';
import api from '../api';

function InputDockingPage() {

    // State untuk menyimpan waktu mulai dan selesai docking
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!startDateTime || !endDateTime) {
            setError('Harap isi waktu mulai dan waktu selesai.');
            return;
        }

        try {
            const response = await api.post('/docking', {
                start_datetime: startDateTime,
                end_datetime: endDateTime,
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            setMessage('Periode docking berhasil disimpan!');

            // Kosongkan form setelah berhasil
            setStartDateTime('');
            setEndDateTime('');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saay menyimpan data.';
            setError(errorMessage);
            console.error(err);
        }
    };

    return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Input Periode Docking</h1>
        </div>

        <div className="space-y-6">
            {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md" role="alert">
                    {message}
                </div>
            )}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md" role="alert">
                    {error}
                </div>
            )}

            {/* Card Form */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Input Waktu Mulai */}
                        <div>
                            <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700 mb-2">
                                Waktu Mulai Docking
                            </label>
                            <input
                                type="datetime-local"
                                id="start_datetime"
                                value={startDateTime}
                                onChange={(e) => setStartDateTime(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>

                        {/* Input Waktu Selesai */}
                        <div>
                            <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700 mb-2">
                                Waktu Selesai Docking
                            </label>
                            <input
                                type="datetime-local"
                                id="end_datetime"
                                value={endDateTime}
                                onChange={(e) => setEndDateTime(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6 text-right">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Simpan Periode Docking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
);
}

export default InputDockingPage;
    