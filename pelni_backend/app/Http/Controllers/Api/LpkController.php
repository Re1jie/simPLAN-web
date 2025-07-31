<?php

namespace App\Http\Controllers\Api; // Pastikan namespace-nya Api

use App\Http\Controllers\Controller; // Controller dasar
use App\Models\Perjalanan;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class LpkController extends Controller
{
    /**
     * Menerima, mem-parsing, dan menyimpan data LPK dari API request.
     */
    public function store(Request $request)
    {
        // 1. Validasi: Ini tetap sama
        $validated = $request->validate([
            'nama_kapal' => 'required|string|max:100',
            'voyage' => 'required|string|max:50',
            'lpk_data' => 'required|string',
        ]);

        $lines = explode("\n", trim($validated['lpk_data']));
        $parsedCount = 0;

        // 2. Logika Parsing: Ini tetap sama
        foreach ($lines as $line) {
            if (empty(trim($line))) continue;

            $parts = preg_split('/\s+/', trim($line));
            $data = $this->parseLine($parts);

            if ($data) {
                Perjalanan::create([
                    'nama_kapal' => $validated['nama_kapal'],
                    'voyage' => $validated['voyage'],
                    'pelabuhan_dari' => $data['pelabuhan_dari'],
                    'pelabuhan_ke' => $data['pelabuhan_ke'],
                    'waktu_berangkat' => $data['waktu_berangkat'],
                    'waktu_tiba' => $data['waktu_tiba'],
                    'faktor_labuh_mulai' => $data['faktor_labuh_mulai'],
                    'faktor_labuh_selesai' => $data['faktor_labuh_selesai'],
                    'total_faktor_labuh_menit' => $data['total_faktor_labuh_menit'],
                    'jarak_tempuh' => $data['jarak_tempuh'],
                ]);
                $parsedCount++;
            }
        }

        // 3. Respons: INI BAGIAN YANG BERUBAH
        if ($parsedCount > 0) {
            // Mengembalikan respons JSON dengan status 201 (Created)
            return response()->json(['message' => "Berhasil menyimpan {$parsedCount} data perjalanan."], 201);
        }

        // Jika tidak ada data yang berhasil diproses
        return response()->json(['message' => 'Tidak ada data yang dapat diproses atau format tidak sesuai.'], 400);
    }

    /**
     * Helper function untuk mem-parsing satu baris data.
     * Logika ini tidak berubah.
     */
    private function parseLine(array $parts): ?array
    {
        try {
            // Mengidentifikasi jumlah kolom untuk menentukan format
            // Pola yang mungkin: [PortA, PortB, TglTD, JamTD, TglTA, JamTA, Hari, Jam, Jarak, Kecepatan] -> 10 kolom
            // Atau dengan faktor labuh -> 16 kolom
            // Namun, karena ada nama pelabuhan seperti "Tg. Priok", kita tidak bisa hanya mengandalkan spasi
            // Kita harus bekerja dari kanan ke kiri karena formatnya lebih konsisten

            // Kolom terakhir adalah kecepatan_rata, kedua terakhir adalah jarak_tempuh
            // Kita akan abaikan data kalkulasi dari input

            $kecepatan_rata = array_pop($parts);
            $jarak_tempuh = array_pop($parts);

            // Kolom-kolom sisanya adalah data konstan yang akan kita proses
            $kolomData = count($parts);

            if ($kolomData === 8) { // Tanpa faktor labuh
                 return [
                    'pelabuhan_dari' => $parts[0] . (isset($parts[1]) && !preg_match('/^\d{2}-/', $parts[1]) ? ' ' . array_splice($parts, 1, 1)[0] : ''),
                    'pelabuhan_ke' => $parts[1] . (isset($parts[2]) && !preg_match('/^\d{2}-/', $parts[2]) ? ' ' . array_splice($parts, 2, 1)[0] : ''),
                    'waktu_berangkat' => Carbon::createFromFormat('d-M-y H:i', $parts[2] . ' ' . $parts[3]),
                    'waktu_tiba' => Carbon::createFromFormat('d-M-y H:i', $parts[4] . ' ' . $parts[5]),
                    'faktor_labuh_mulai' => null,
                    'faktor_labuh_selesai' => null,
                    'total_faktor_labuh_menit' => $this->timeToMinutes($parts[7]),
                    'jarak_tempuh' => (int) $jarak_tempuh,
                ];
            } elseif ($kolomData === 12) { // Dengan faktor labuh
                return [
                    'pelabuhan_dari' => $parts[0] . (isset($parts[1]) && !preg_match('/^\d{2}-/', $parts[1]) ? ' ' . array_splice($parts, 1, 1)[0] : ''),
                    'pelabuhan_ke' => $parts[1] . (isset($parts[2]) && !preg_match('/^\d{2}-/', $parts[2]) ? ' ' . array_splice($parts, 2, 1)[0] : ''),
                    'waktu_berangkat' => Carbon::createFromFormat('d-M-y H:i', $parts[2] . ' ' . $parts[3]),
                    'waktu_tiba' => Carbon::createFromFormat('d-M-y H:i', $parts[4] . ' ' . $parts[5]),
                    'faktor_labuh_mulai' => Carbon::createFromFormat('d-M-y H:i', $parts[6] . ' ' . $parts[7]),
                    'faktor_labuh_selesai' => Carbon::createFromFormat('d-M-y H:i', $parts[8] . ' ' . $parts[9]),
                    'total_faktor_labuh_menit' => $this->timeToMinutes($parts[11]),
                    'jarak_tempuh' => (int) $jarak_tempuh,
                ];
            }

            return null; // Format tidak dikenali

        } catch (\Exception $e) {
            // Jika ada error (misal: format tanggal salah), abaikan baris ini
            Log::error('LPK Parsing Error: ' . $e->getMessage() . ' on line: ' . implode(' ', $parts));
            return null;
        }
    }

    /**
     * Helper untuk konversi 'HH:MM' ke total menit.
     * Logika ini tidak berubah.
     */
    private function timeToMinutes(string $time): int
    {
        if (!str_contains($time, ':')) return 0;
        $parts = explode(':', $time);
        if (count($parts) != 2) return 0;
        return ((int)$parts[0] * 60) + (int)$parts[1];
    }
}
