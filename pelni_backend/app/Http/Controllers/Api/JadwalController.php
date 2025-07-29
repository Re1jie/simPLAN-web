<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Jadwal;
use Carbon\Carbon;
use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;


class JadwalController extends Controller
{
    private $firebase;
    private $database;
    private $dbName = 'activity_log';

    public function __construct()
    {
        // Inisialisasi Firebase
        $serviceAccountPath = storage_path('app/simplan-app-record-firebase-adminsdk-fbsvc-bd74864ac0.json');

        try {
            $this->firebase = (new Factory)
                ->withServiceAccount($serviceAccountPath)
                ->withDatabaseUri('https://simplan-app-record-default-rtdb.firebaseio.com/');

            $this->database = $this->firebase->createDatabase();
        } catch (\Exception $e) {
            // Jika inisialisasi Firebase gagal, catat error tapi jangan hentikan aplikasi
            Log::error('Koneksi Firebase Gagal: ' . $e->getMessage());
            $this->database = null; // Set database menjadi null agar method lain tidak error
        }
    }

    /**
     * Method privat untuk mencatat aktivitas ke Firebase.
     *
     * @param string $action Deskripsi aksi yang dilakukan.
     * @param array $context Data tambahan terkait aksi (misal: nama kapal, voyage).
     */
    private function logActivityToFirebase(string $action, array $context = [])
    {
        // Jangan lakukan apa-apa jika koneksi database Firebase tidak ada
        if (!$this->database) {
            return;
        }

        try {
            // Mengambil user yang sedang terautentikasi melalui Sanctum/API
            $user = request()->user();
            $userName = $user ? $user->name : 'Sistem'; // Fallback jika user tidak ditemukan

            $this->database->getReference($this->dbName)->push([
                'user' => $userName,
                'action' => $action,
                'context' => $context,
                'timestamp' => Carbon::now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            // Catat error ke log Laravel jika pengiriman ke Firebase gagal
            Log::error('Gagal mengirim log ke Firebase: ' . $e->getMessage());
        }
    }

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
        $validatedData = $request->validate([
            'voyage' => 'required|integer',
            'nama_kapal' => 'required|string',
            'rute'=> 'nullable|string|max:1',
            'jadwal' => 'required|array',
            'jadwal.*.pelabuhan' => 'required|string|max:255',
            'jadwal.*.eta' => 'required|string',
            'jadwal.*.etd' => 'required|string',
        ]);

        $voyage = $validatedData['voyage'];
        $namaKapal = $validatedData['nama_kapal'];
        $ruteValue = $request->input('rute');
        $jadwalVoyage = $validatedData['jadwal'];

        try {
            DB::transaction(function () use ($voyage, $namaKapal, $jadwalVoyage, $ruteValue) {

                // Hapus jadwal lama untuk voyage dan nama kapal yang sama
                Jadwal::where('voyage', $voyage)->where('nama_kapal', $namaKapal)->delete();

                foreach ($jadwalVoyage as $jadwalData) {

                    // 2. Ganti logika parsing tanggal menggunakan Carbon
                    // Format 'd-M-y H:i' cocok untuk "29-Dec-24 00:00"
                    $waktuTiba = Carbon::createFromFormat('d-M-y H:i', $jadwalData['eta'])->toDateTimeString();

                    $waktuBerangkat = (strpos($jadwalData['etd'], 'N/A') !== false)
                        ? null
                        : Carbon::createFromFormat('d-M-y H:i', $jadwalData['etd'])->toDateTimeString();

                    Jadwal::create([
                        'voyage' => $voyage,
                        'nama_kapal' => $namaKapal,
                        'rute' => $ruteValue,
                        'pelabuhan' => $jadwalData['pelabuhan'],
                        'waktu_tiba' => $waktuTiba,
                        'waktu_berangkat' => $waktuBerangkat,
                    ]);
                }
            });

            // --- LOGGING KE FIREBASE SETELAH SUKSES ---
            $this->logActivityToFirebase(
                "Memperbarui Jadwal Voyage",
                ['kapal' => $namaKapal, 'voyage' => $voyage]
            );

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
            // --- LOGGING KE FIREBASE SETELAH SUKSES ---
            $this->logActivityToFirebase(
                "Menghapus Jadwal Voyage",
                ['kapal' => $validated['nama_kapal'], 'voyage' => $validated['voyage']]
            );
            return response()->json(['message' => 'Seluruh jadwal voyage berhasil dihapus.']);
        }

        return response()->json(['message' => 'Data tidak ditemukan.'], 404);
    }
}
