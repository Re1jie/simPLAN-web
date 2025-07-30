import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// DAFTAR NAMA KAPAL
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

// Helper function untuk membersihkan data numerik
const cleanAndParseNumber = (str) => {
    if (!str) return null;
    if (str.trim() === '-') return 0;
    if (str.startsWith('(') && str.endsWith(')')) {
        const value = str.substring(1, str.length - 1);
        return -parseFloat(value);
    }
    const number = parseFloat(str);
    return isNaN(number) ? null : number;
};

// Fungsi parsing yang sudah diperbarui
const parseJadwalText = (rawText) => {
    if (!rawText) return [];
    const lines = rawText.trim().split('\n');

    return lines.map(line => {
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length < 3) return null;

        const isFinalDestination = parts.length < 9;

        let eta, etd, pelabuhan, jarak, faktor_pasang_surut, jam_labuh;
        
        // Logika parsing dari belakang untuk akurasi
        if (isFinalDestination) {
            const jamEta = parts.pop();
            const tglEta = parts.pop();
            parts.pop(); // Hari, tidak dipakai
            
            eta = `${tglEta} ${jamEta}`;
            etd = 'N/A N/A';
            pelabuhan = parts.join(' ');
            jarak = null;
            faktor_pasang_surut = null;
            jam_labuh = null;

        } else {
            const jamEtd = parts.pop();
            const tglEtd = parts.pop();
            parts.pop(); // Hari ETD

            const jamEta = parts.pop();
            const tglEta = parts.pop();
            parts.pop(); // Hari ETA

            eta = `${tglEta} ${jamEta}`;
            etd = `${tglEtd} ${jamEtd}`;
            
            // Ambil 5 data numerik dari belakang
            const numericParts = parts.splice(-5); 
            pelabuhan = parts.join(' ');

            jarak = cleanAndParseNumber(numericParts[0]);
            faktor_pasang_surut = cleanAndParseNumber(numericParts[2]);
            jam_labuh = cleanAndParseNumber(numericParts[4]);
        }

        return {
            pelabuhan,
            eta,
            etd,
            jarak,
            faktor_pasang_surut,
            jam_labuh,
        };
    }).filter(Boolean); // Hapus baris yang tidak valid
};


function InputJadwalPage() {
    const navigate = useNavigate();
    const [rawText, setRawText] = useState('');
    const [voyage, setVoyage] = useState('');
    const [namaKapal, setNamaKapal] = useState('');
    const [rute, setRute] = useState('');
    const [kecepatan, setKecepatan] = useState(''); // <-- 1. STATE BARU

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        setMessage('');
        setError('');

        // Validasi input, termasuk kecepatan
        if (!voyage || !namaKapal || !rawText || !kecepatan) {
            alert("Silakan isi nomor voyage, nama kapal, kecepatan, dan data jadwal.");
            setIsLoading(false);
            return;
        }
        
        const hasilParsing = parseJadwalText(rawText);

        if (hasilParsing.length === 0) {
            alert("Tidak ada data valid yang bisa diproses dari teks yang Anda masukkan.");
            setIsLoading(false);
            return;
        }

        const token = sessionStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
        
        // <-- 3. PAYLOAD BARU UNTUK API
        const payload = {
            voyage: voyage,
            nama_kapal: namaKapal,
            rute: rute,
            kecepatan: parseFloat(kecepatan),
            jadwal: hasilParsing,
        };

        try {
            await api.post('/jadwal/batch', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage('Data voyage berhasil disimpan!');
            // Kosongkan form setelah sukses
            setRawText('');
            setVoyage('');
            setNamaKapal('');
            setRute('');
            setKecepatan('');
            
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Input Jadwal Voyage</h1>
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
                <form onSubmit={handleConfirm} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label htmlFor="voyage" className="block text-sm font-medium text-gray-700">Voyage Ke-</label>
                            <input
                                type="number" id="voyage" value={voyage} onChange={(e) => setVoyage(e.target.value)}
                                required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Contoh: 1"
                            />
                        </div>
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
                        {/* <-- 2. INPUT FIELD BARU UNTUK KECEPATAN --> */}
                        <div>
                            <label htmlFor="kecepatan" className="block text-sm font-medium text-gray-700">Kecepatan (Knots)</label>
                            <input
                                type="number" step="0.1" id="kecepatan" value={kecepatan} onChange={(e) => setKecepatan(e.target.value)}
                                required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Contoh: 17.5"
                            />
                        </div>
                        <div>
                            <label htmlFor="rute" className="block text-sm font-medium text-gray-700">Pilihan Rute</label>
                            <select
                                id="rute" value={rute} onChange={(e) => setRute(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">A=B</option>
                                <option value="A">Rute A</option>
                                <option value="B">Rute B</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="raw_text" className="block text-sm font-medium text-gray-700">Paste Data Excel Disini</label>
                        <textarea
                            id="raw_text" value={rawText} onChange={(e) => setRawText(e.target.value)}
                            className="mt-1 h-80 w-full rounded-md border border-gray-300 p-4 font-mono shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Contoh: Tg.Priok ... 4-Jan-25 04:00 ... Sabtu 4-Jan-25 16:00"
                        />
                    </div>

                    <div className="text-right">
                        <button 
                            type="submit"
                            disabled={isLoading || !rawText || !namaKapal || !voyage || !kecepatan} // tambah kecepatan di kondisi disabled
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

export default InputJadwalPage;