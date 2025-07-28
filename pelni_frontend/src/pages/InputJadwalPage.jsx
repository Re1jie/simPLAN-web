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
    const [isLoading, setIsLoading] = useState(false);
    const [voyage, setVoyage] = useState('');
    const [namaKapal, setNamaKapal] = useState('');
    const [rute, setRute] = useState('');

    const handleConfirm = async () => {
        setIsLoading(true);

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

        const token = localStorage.getItem('authToken');
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
            alert('Jadwal berhasil disimpan!');
            navigate('/dashboard/input-jadwal');
        } catch (error) {
            console.error("Gagal mengirim data ke backend:", error);
            alert("Terjadi error saat mengirim data ke server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold">Input Jadwal Voyage</h1>
            <p className="mt-2 text-gray-600">
                Masukkan nama kapal, lalu salin data jadwal dari Excel ke dalam kotak di bawah ini.
            </p>
            
            {/* BARU: Grid diubah menjadi 3 kolom untuk mengakomodasi Rute */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                    <label htmlFor="voyage" className="block text-sm font-medium text-gray-700">Voyage Ke-</label>
                    <input
                        type="number" id="voyage" value={voyage} onChange={(e) => setVoyage(e.target.value)}
                        required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Contoh: 1"
                    />
                </div>
                <div>
                    <label htmlFor="nama_kapal" className="bcleraalock text-sm font-medium text-gray-700">Nama Kapal</label>
                    <select
                        id="nama_kapal" value={namaKapal} onChange={(e) => setNamaKapal(e.target.value)}
                        required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="" disabled>-- Pilih Kapal --</option>
                        {DAFTAR_KAPAL.map(kapal => <option key={kapal} value={kapal}>{kapal}</option>)}
                    </select>
                </div>
                 {/* BARU: Form input untuk Rute */}
                <div>
                    <label htmlFor="rute" className="block text-sm font-medium text-gray-700">Pilihan Rute</label>
                    <select
                        id="rute" value={rute} onChange={(e) => setRute(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="">A=B</option>
                        <option value="A">Rute A</option>
                        <option value="B">Rute B</option>
                    </select>
                </div>
            </div>
            
            <div className="mt-4">
                <label htmlFor="raw_text" className="block text-sm font-medium text-gray-700">Paste Data Excel Disini</label>
                <textarea
                    id="raw_text" value={rawText} onChange={(e) => setRawText(e.target.value)}
                    className="mt-1 h-80 w-full rounded-md border border-gray-300 p-4 font-mono shadow-sm"
                    placeholder="Contoh: Tg.Priok ... Minggu 29-Dec-24 00:00..."
                />
            </div>

            <div className="mt-4 flex justify-end">
                <button 
                    onClick={handleConfirm}
                    disabled={isLoading || !rawText || !namaKapal || !voyage}
                    className="rounded-md bg-blue-600 py-2 px-6 text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? 'Memproses...' : 'Confirm'}
                </button>
            </div>
        </div>
    );
}

export default InputJadwalPage;