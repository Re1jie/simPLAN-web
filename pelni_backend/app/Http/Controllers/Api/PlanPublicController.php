<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Jadwal;
use App\Models\PlanPublic;
use Illuminate\Support\Facades\DB;

class PlanPublicController extends Controller
{
    // Mengambil semua data dari Plan Public untuk ditampilkan
    public function index()
    {
        $publicPlans = PlanPublic::orderBy('waktu_tiba', 'asc')->get();
        return response()->json($publicPlans);
    }

    // Mem-publish voyage dari Jadwals ke PlanPublics
    public function publish(Request $request)
    {
        $validated = $request->validate([
            'nama_kapal' => 'required|string',
            'voyage' => 'required|integer',
        ]);

        $jadwalsToPublish = Jadwal::where('nama_kapal', $validated['nama_kapal'])
                                ->where('voyage', $validated['voyage'])
                                ->get();

        if ($jadwalsToPublish->isEmpty()) {
            return response()->json(['message' => 'Data voyage tidak ditemukan di Jadwal.'], 404);
        }

        DB::transaction(function () use ($validated, $jadwalsToPublish) {
            // Hapus data lama di PlanPublics agar tidak duplikat
            PlanPublic::where('nama_kapal', $validated['nama_kapal'])
                      ->where('voyage', $validated['voyage'])
                      ->delete();

            // Salin data baru dari Jadwals ke PlanPublics
            foreach ($jadwalsToPublish as $jadwal) {
                PlanPublic::create($jadwal->toArray());
            }
        });

        return response()->json(['message' => 'Voyage berhasil di-update ke Plan Public.'], 201);
    }
}
