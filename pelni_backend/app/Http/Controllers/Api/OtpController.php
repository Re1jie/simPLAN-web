<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\Perjalanan;
use Illuminate\Http\Request;
use Carbon\Carbon;

class OtpController extends Controller
{
    /**
     * Menghitung persentase OTP berdasarkan selisih jam.
     */
    private function getOtpPercentage($hoursDifference)
    {
        if ($hoursDifference > 48) return 50;
        if ($hoursDifference > 24) return 60;
        if ($hoursDifference > 12) return 70;
        if ($hoursDifference > 6) return 80;
        if ($hoursDifference > 2) return 90;
        return 100;
    }

    /**
     * Mengkalkulasi On-Time-Performance untuk kapal dan voyage tertentu.
     */
    public function calculateOtp(Request $request, $nama_kapal, $voyage)
    {
        // 1. Ambil data jadwal (rencana) dan perjalanan (aktual)
        $jadwals = Jadwal::where('nama_kapal', $nama_kapal)
            ->where('voyage', $voyage)
            ->orderBy('waktu_tiba', 'asc')
            ->get();

        // Ambil data perjalanan dan ubah menjadi array agar bisa dimodifikasi (unset)
        $perjalanansPool = Perjalanan::where('nama_kapal', $nama_kapal)
            ->where('voyage', $voyage)
            ->orderBy('waktu_tiba', 'asc')
            ->get()->all(); // <-- Ubah menjadi array

        if ($jadwals->isEmpty() || empty($perjalanansPool)) {
            return response()->json(['message' => 'Data jadwal atau perjalanan tidak ditemukan.'], 404);
        }

        // 2. Proses dan gabungkan data
        $otpResults = [];
        $totalOtpTa = 0;
        $totalOtpTd = 0;
        $countTa = 0;
        $countTd = 0;

        foreach ($jadwals as $index => $jadwal) {
            $perjalanan = null;
            $matchedKey = null;

            // --- LOGIKA PENCARIAN BARU ---
            // Cari perjalanan yang cocok di dalam pool yang tersedia
            foreach ($perjalanansPool as $key => $p) {
                // Cocokkan berdasarkan pelabuhan tujuan
                if ($p->pelabuhan_ke === $jadwal->pelabuhan) {
                    $perjalanan = $p;
                    $matchedKey = $key;
                    break; // Hentikan pencarian setelah menemukan yang cocok
                }
            }

            // Jika data perjalanan yang cocok ditemukan
            if ($perjalanan) {
                // Hapus data yang sudah dicocokkan dari pool agar tidak terpakai lagi
                unset($perjalanansPool[$matchedKey]);

                $waktuTibaJadwal = Carbon::parse($jadwal->waktu_tiba);
                $waktuTibaPerjalanan = Carbon::parse($perjalanan->waktu_tiba);
                $waktuBerangkatPerjalanan = Carbon::parse($perjalanan->waktu_berangkat);

                // 3. Kalkulasi OTP Tiba (TA)
                $selisihTibaJam = $waktuTibaJadwal->diffInHours($waktuTibaPerjalanan);
                $otpTa = $this->getOtpPercentage($selisihTibaJam);
                $totalOtpTa += $otpTa;
                $countTa++;

                // 4. Kalkulasi OTP Berangkat (TD), dimulai dari baris kedua (port kedua)
                // Ini untuk mengukur waktu turnaround di pelabuhan. Pelabuhan pertama
                // tidak memiliki waktu turnaround, hanya keberangkatan awal.
                $otpTd = null;
                if ($index > 0) {
                    $selisihBerangkatJam = $waktuTibaJadwal->diffInHours($waktuBerangkatPerjalanan);
                    $otpTd = $this->getOtpPercentage($selisihBerangkatJam);
                    $totalOtpTd += $otpTd;
                    $countTd++;
                }

                $otpResults[] = [
                    'pelabuhan' => $jadwal->pelabuhan,
                    'eta' => $jadwal->waktu_tiba,
                    'ta' => $perjalanan->waktu_tiba,
                    'etd' => $jadwal->waktu_berangkat,
                    'td' => $perjalanan->waktu_berangkat,
                    'otp_ta' => $otpTa,
                    'otp_td' => $otpTd,
                ];
            }
        }

        // 5. Hitung rata-rata
        $totalEntries = $countTa + $countTd;
        $averageOtp = $totalEntries > 0 ? ($totalOtpTa + $totalOtpTd) / $totalEntries : 0;

        return response()->json([
            'otp_data' => $otpResults,
            'average_otp' => round($averageOtp, 2)
        ]);
    }
}
