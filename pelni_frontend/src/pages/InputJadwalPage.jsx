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

const parseJadwalText = (rawText) => {
  const lines = rawText.trim().split('\n');
  const parsedData = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const parts = line.split(/\s+/).filter(Boolean);

    let jamEtd = 'N/A';
    let tglEtd = 'N/A';
    let hariEtd = '';
    
    let jamEta = '';
    let tglEta = '';
    let hariEta = '';

    let mainParts;

    // Cek apakah formatnya lengkap (ETA & ETD) atau hanya ETA
    if (parts.length >= 8) { // Format lengkap
        jamEtd = parts.pop();
        tglEtd = parts.pop();
        hariEtd = parts.pop();

        jamEta = parts.pop();
        tglEta = parts.pop();
        hariEta = parts.pop();
        
        mainParts = parts;
    } else if (parts.length >= 4) { // Format tujuan akhir (hanya ETA)
        jamEta = parts.pop();
        tglEta = parts.pop();
        hariEta = parts.pop();
        
        mainParts = parts;
    } else {
        continue; // Lewati baris yang sama sekali tidak valid
    }

    let portNameParts = [];
    for (const part of mainParts) {
      if (!isNaN(part) && part.indexOf('-') === -1) {
        break;
      }
      portNameParts.push(part);
    }
    const namaPelabuhan = portNameParts.join(' ');
    
    if (!namaPelabuhan) continue;

    parsedData.push({
      pelabuhan: namaPelabuhan,
      eta: `${tglEta} ${jamEta}`,
      etd: `${tglEtd} ${jamEtd}`, // Akan berisi 'N/A N/A' untuk tujuan akhir
    });
  }
  return parsedData;
};

function InputJadwalPage() {
    const navigate = useNavigate();
    const [rawText, setRawText] = useState('');
    const [voyage, setVoyage] = useState('');
    const [namaKapal, setNamaKapal] = useState('');
    const [rute, setRute] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        setMessage('');
        setError('');

        if (!voyage || !namaKapal || !rawText) {
            alert("Silakan isi nomor voyage, nama kapal, dan data jadwal.");
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

        try {
            await api.post('/jadwal/batch', 
                {
                    voyage: voyage,
                    nama_kapal: namaKapal,
                    rute: rute,
                    jadwal: hasilParsing,
                }, 
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setMessage('Data voyage berhasil disimpan!');            
            
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            placeholder="Contoh: Tg.Priok ... Minggu 29-Dec-24 00:00..."
                        />
                    </div>

                    <div className="text-right">
                        <button 
                            type="submit"
                            disabled={isLoading || !rawText || !namaKapal || !voyage}
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