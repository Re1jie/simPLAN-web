<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Perjalanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LpkController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kapal' => 'required|string|max:100',
            'voyage' => 'required|string|max:50',
            'initial_waktu_tiba' => 'required|date',
            'lpk_data' => 'required|string',
        ]);

        $lines = explode("\n", trim($validated['lpk_data']));

        $firstLineParts = !empty($lines) ? explode("\t", $lines[0]) : null;
        if (!$firstLineParts || empty(trim($firstLineParts[0]))) {
            return response()->json(['message' => 'Data LPK tidak valid atau baris pertama kosong.'], 400);
        }
        $initialPort = trim($firstLineParts[0]);


        DB::beginTransaction();

        try {
            $initialTime = Carbon::parse($validated['initial_waktu_tiba']);

            Perjalanan::create([
                'nama_kapal' => $validated['nama_kapal'],
                'voyage' => $validated['voyage'],
                'pelabuhan_dari' => $initialPort,
                'pelabuhan_ke' => $initialPort,
                'waktu_berangkat' => $initialTime,
                'waktu_tiba' => $initialTime,
                'jarak_tempuh' => 0,
                'total_faktor_labuh_menit' => 0,
            ]);

            $parsedCount = 0;
            $errorLines = [];

            foreach ($lines as $index => $line) {
                if (empty(trim($line))) continue;

                $dataParts = array_map('trim', explode("\t", $line));
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

            DB::commit();

            if ($parsedCount > 0) {
                // Adjust success message to reflect the initial record
                $message = "Berhasil menyimpan 1 data awal dan {$parsedCount} data perjalanan.";
                if (!empty($errorLines)) {
                    $message .= " Gagal memproses baris: " . implode(', ', $errorLines) . ". Periksa log untuk detail.";
                }
                return response()->json(['message' => $message], 201);
            }

            // This part might now be unreachable if the first line check passes, but kept for safety
            return response()->json([
                'message' => 'Tidak ada data perjalanan yang dapat diproses dari text area.'
            ], 400);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('LPK Store Exception: ' . $e->getMessage());
            return response()->json(['message' => 'Terjadi kesalahan internal saat menyimpan data.'], 500);
        }
    }

    // The parseLine and calculateTotalLabuhMinutes.
    private function parseLine(array $parts): ?array
    {
        // ... (no changes here)
        if (count($parts) < 14) {
             Log::warning('LPK Parsing Failed: Jumlah kolom kurang dari 14.', ['parts' => $parts]);
             return null;
        }

        try {
            $pelabuhanDari = $parts[0];
            $pelabuhanKe = $parts[1];
            $waktuBerangkat = Carbon::createFromFormat('d-M-y H:i', $parts[2] . ' ' . $parts[3]);
            $waktuTiba = Carbon::createFromFormat('d-M-y H:i', $parts[4] . ' ' . $parts[5]);

            $faktorLabuhMulai = null;
            $faktorLabuhSelesai = null;
            $totalFaktorLabuhMenit = $this->calculateTotalLabuhMinutes($parts[11], $parts[12]);
            $jarakTempuh = (int) $parts[13];

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
            Log::error('LPK Parsing Exception: ' . $e->getMessage(), [
                'line_data' => implode("\t", $parts)
            ]);
            return null;
        }
    }

    private function calculateTotalLabuhMinutes(string $dayIndicator, string $time): int
    {
         $timeMinutes = 0;
        if (str_contains($time, ':')) {
            $parts = explode(':', $time);
            if (count($parts) == 2) {
                $timeMinutes = ((int)$parts[0] * 60) + (int)$parts[1];
            }
        }

        $dayValue = (int) $dayIndicator;
        $dayOffsetMinutes = 0;

        if ($dayValue >= 30) {
            $dayDifference = $dayValue - 30;
            $dayOffsetMinutes = $dayDifference * 1440;
        }
        else {
            $dayOffsetMinutes = $dayValue * 1440;
        }

        return $dayOffsetMinutes + $timeMinutes;
    }
}
