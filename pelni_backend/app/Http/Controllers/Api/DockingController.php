<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Docking;
use Illuminate\Http\Request;

class DockingController extends Controller
{
    // Mengambil semua data docking
    public function index()
    {
        $dockingData = Docking::all();
        return response()->json($dockingData);
    }

    // Menyimpan data docking baru
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'nama_kapal' => 'required|string|max:255',
            'waktu_mulai_docking' => 'required|date',
            'waktu_selesai_docking' => 'required|date|after_or_equal:waktu_mulai_docking',
            'detail_docking' => 'required|string|max:255',
        ]);

        $docking = Docking::create($validatedData);

        return response()->json([
            'message' => 'Data docking berhasil disimpan!',
            'data' => $docking
        ], 201);
    }

    public function destroy($id)
    {
        $docking = Docking::find($id);

        if (!$docking) {
            return response()->json(['message' => 'Data docking tidak ditemukan.'], 404);
        }

        $docking->delete();

        return response()->json(['message' => 'Data docking berhasil dihapus.']);
    }
}
