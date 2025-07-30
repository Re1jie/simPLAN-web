<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Jadwal;
use Carbon\Carbon;

class JadwalController extends Controller
{
    public function index(Request $request)
    {
        $query = Jadwal::query();

        // Jika ada parameter 'voyage' di URL, lakukan filter
        if ($request->has('voyage')) {
            $query->where('voyage', $request->query('voyage'));
        }

        if ($request->has('nama_kapal')) {
            $query->where('nama_kapal', $request->query('nama_kapal'));
        }

        // Langsung eksekusi query yang sudah difilter (atau tidak)
        $jadwal = $query->orderBy('waktu_tiba', 'asc')->get();

        // Format ulang data secara manual sebelum dikirim
        $formattedJadwal = $jadwal->map(function ($item) {
            return [
                'id' => $item->id,
                'voyage' => $item->voyage,
                'nama_kapal' => $item->nama_kapal,
                'rute'=> $item->rute,
                'pelabuhan' => $item->pelabuhan,
                'waktu_tiba' => $item->waktu_tiba->toIso8601String(),
                'waktu_berangkat' => $item->waktu_berangkat ? $item->waktu_berangkat->toIso8601String() : null,
            ];
        });

        return response()->json($formattedJadwal);
    }
    // Metode baru untuk menyimpan banyak jadwal sekaligus
    public function storeBatch(Request $request)
    {
        // Validasi sudah benar, tidak perlu diubah
        $validatedData = $request->validate([
            'voyage' => 'required|integer',
            'nama_kapal' => 'required|string',
            'rute'=> 'nullable|string|max:1',
            'kecepatan' => 'required|numeric', // Diambil dari level atas
            'jadwal' => 'required|array',
            'jadwal.*.pelabuhan' => 'required|string|max:255',
            'jadwal.*.eta' => 'required|string',
            'jadwal.*.etd' => 'required|string',
            'jadwal.*.jarak' => 'nullable|numeric', // Data per baris jadwal
            'jadwal.*.faktor_pasang_surut' => 'nullable|numeric',
            'jadwal.*.jam_labuh' => 'nullable|numeric',
        ]);

        $voyage = $validatedData['voyage'];
        $namaKapal = $validatedData['nama_kapal'];
        $ruteValue = $request->input('rute');
        $jadwalVoyage = $validatedData['jadwal'];
        $kecepatanKapal = $validatedData['kecepatan']; // Ambil kecepatan

        try {
            DB::transaction(function () use ($voyage, $namaKapal, $jadwalVoyage, $ruteValue, $kecepatanKapal) { // Tambahkan $kecepatanKapal ke 'use'

                // Hapus jadwal lama untuk voyage dan nama kapal yang sama
                Jadwal::where('voyage', $voyage)->where('nama_kapal', $namaKapal)->delete();

                foreach ($jadwalVoyage as $jadwalData) {
                    $waktuTiba = Carbon::createFromFormat('d-M-y H:i', $jadwalData['eta'])->toDateTimeString();
                    $waktuBerangkat = (strpos($jadwalData['etd'], 'N/A') !== false)
                        ? null
                        : Carbon::createFromFormat('d-M-y H:i', $jadwalData['etd'])->toDateTimeString();

                    // === PERUBAHAN DI SINI ===
                    // Tambahkan kolom baru ke dalam array create()
                    Jadwal::create([
                        'voyage' => $voyage,
                        'nama_kapal' => $namaKapal,
                        'rute' => $ruteValue,
                        'pelabuhan' => $jadwalData['pelabuhan'],
                        'waktu_tiba' => $waktuTiba,
                        'waktu_berangkat' => $waktuBerangkat,

                        // KOLOM BARU YANG DITAMBAHKAN
                        'kecepatan' => $kecepatanKapal, // Kecepatan sama untuk semua baris
                        'jarak' => $jadwalData['jarak'],
                        'faktor_pasang_surut' => $jadwalData['faktor_pasang_surut'],
                        'jam_labuh' => $jadwalData['jam_labuh'],
                    ]);
                }
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menyimpan data.', 'error' => $e->getMessage()], 500);
        }

        return response()->json(['message' => "Jadwal untuk kapal $namaKapal voyage $voyage berhasil disimpan!"], 201);
    }

    public function destroyByVoyage(Request $request)
    {
        $validated = $request->validate([
            'nama_kapal' => 'required|string',
            'voyage' => 'required|integer',
        ]);

        // Cari dan hapus semua entri yang cocok
        $deletedCount = Jadwal::where('nama_kapal', $validated['nama_kapal'])
                            ->where('voyage', $validated['voyage'])
                            ->delete();

        if ($deletedCount > 0) {
            return response()->json(['message' => 'Seluruh jadwal voyage berhasil dihapus.']);
        }

        return response()->json(['message' => 'Data tidak ditemukan.'], 404);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'nama_kapal' => 'required|string',
            'voyage' => 'required|string',
            'jadwals' => 'required|array',
            'jadwals.*.id' => 'required|exists:jadwals,id',
            'jadwals.*.waktu_tiba' => 'required|string',
            'jadwals.*.waktu_berangkat' => 'required|string',
        ]);

        foreach ($validated['jadwals'] as $jadwalData) {
            $jadwal = Jadwal::find($jadwalData['id']);
            if ($jadwal) {
                $jadwal->update([
                    'waktu_tiba' => $jadwalData['waktu_tiba'],
                    'waktu_berangkat' => $jadwalData['waktu_berangkat'],
                ]);
            }
        }

        return response()->json(['message' => 'Jadwal berhasil diperbarui!']);
    }

    public function show($nama_kapal, $voyage)
    {
        // Ganti URL-encoded space (%20) kembali menjadi spasi biasa
        $nama_kapal_decoded = urldecode($nama_kapal);

        $jadwals = Jadwal::where('nama_kapal', $nama_kapal_decoded)
                         ->where('voyage', $voyage)
                         ->orderBy('waktu_tiba', 'asc') // Urutkan berdasarkan waktu tiba
                         ->get();

        if ($jadwals->isEmpty()) {
            return response()->json(['message' => 'Jadwal tidak ditemukan.'], 404);
        }

        return response()->json($jadwals);
    }
}
