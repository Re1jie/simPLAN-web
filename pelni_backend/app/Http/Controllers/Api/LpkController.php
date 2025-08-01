<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Perjalanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LpkController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kapal' => 'required|string|max:100',
            'voyage' => 'required|string|max:50',
            'lpk_data' => 'required|string',
        ]);

        $lines = explode("\n", trim($validated['lpk_data']));
        $parsedCount = 0;
        $errorLines = [];

        foreach ($lines as $index => $line) {
            if (empty(trim($line))) continue;

            // Memecah baris berdasarkan TAB, bukan spasi. Ini kuncinya.
            $dataParts = explode("\t", $line);

            // Trim setiap bagian untuk menghilangkan spasi ekstra
            $dataParts = array_map('trim', $dataParts);

            $data = $this->parseLine($dataParts);

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
            } else {
                $errorLines[] = $index + 1;
            }
        }

        if ($parsedCount > 0) {
            $message = "Berhasil menyimpan {$parsedCount} data perjalanan.";
            if (!empty($errorLines)) {
                $message .= " Gagal memproses baris: " . implode(', ', $errorLines) . ". Periksa log untuk detail.";
            }
            return response()->json(['message' => $message], 201);
        }

        return response()->json([
            'message' => 'Tidak ada data yang dapat diproses. Pastikan format data dari Excel sudah benar.'
        ], 400);
    }

    /**
     * Fungsi parsing yang jauh lebih robust, dirancang untuk data dari Excel.
     */
    private function parseLine(array $parts): ?array
    {
        // Total kolom dari data mentah Anda adalah 15
        if (count($parts) < 14) {
             Log::warning('LPK Parsing Failed: Jumlah kolom kurang dari 14.', ['parts' => $parts]);
             return null;
        }

        try {
            // Akses data berdasarkan indeks kolom yang pasti
            $pelabuhanDari = $parts[0];
            $pelabuhanKe = $parts[1];
            $waktuBerangkat = Carbon::createFromFormat('d-M-y H:i', $parts[2] . ' ' . $parts[3]);
            $waktuTiba = Carbon::createFromFormat('d-M-y H:i', $parts[4] . ' ' . $parts[5]);

            $faktorLabuhMulai = null;
            $faktorLabuhSelesai = null;
            $totalFaktorLabuhMenit = $this->calculateTotalLabuhMinutes($parts[11], $parts[12]);
            $jarakTempuh = (int) $parts[13]; // Kolom ke-14 (indeks 13)

            // Cek apakah ada data faktor labuh (tanggal dan waktu tidak kosong)
            // Kolom 6, 7, 8, 9
            if (!empty($parts[6]) && !empty($parts[7]) && !empty($parts[8]) && !empty($parts[9])) {
                $faktorLabuhMulai = Carbon::createFromFormat('d-M-y H:i', $parts[6] . ' ' . $parts[7]);
                $faktorLabuhSelesai = Carbon::createFromFormat('d-M-y H:i', $parts[8] . ' ' . $parts[9]);
            }

            return [
                'pelabuhan_dari' => $pelabuhanDari,
                'pelabuhan_ke' => $pelabuhanKe,
                'waktu_berangkat' => $waktuBerangkat,
                'waktu_tiba' => $waktuTiba,
                'faktor_labuh_mulai' => $faktorLabuhMulai,
                'faktor_labuh_selesai' => $faktorLabuhSelesai,
                'total_faktor_labuh_menit' => $totalFaktorLabuhMenit,
                'jarak_tempuh' => $jarakTempuh,
            ];

        } catch (\Exception $e) {
            // Catat error ke log untuk debugging jika terjadi kesalahan tak terduga
            Log::error('LPK Parsing Exception: ' . $e->getMessage(), [
                'line_data' => implode("\t", $parts)
            ]);
            return null;
        }
    }

     private function calculateTotalLabuhMinutes(string $dayIndicator, string $time): int
    {
        // Langkah 1: Konversi bagian waktu (JJ:MM) ke menit
        $timeMinutes = 0;
        if (str_contains($time, ':')) {
            $parts = explode(':', $time);
            if (count($parts) == 2) {
                $timeMinutes = ((int)$parts[0] * 60) + (int)$parts[1];
            }
        }

        // Langkah 2: Hitung menit tambahan dari indikator hari
        $dayValue = (int) $dayIndicator;
        $dayOffsetMinutes = 0;

        // Jika nilai lebih besar dari 30, hitung selisihnya sebagai hari tambahan
        // 1 hari = 1440 menit
        if ($dayValue > 30) {
            $dayDifference = $dayValue - 30;
            $dayOffsetMinutes = $dayDifference * 1440;
        }

        // Langkah 3: Jumlahkan kedua nilai
        return $dayOffsetMinutes + $timeMinutes;
    }
}
