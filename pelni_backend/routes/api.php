<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JadwalController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/jadwal', [JadwalController::class, 'index']);
    Route::post('/jadwal', [JadwalController::class, 'store']); // Untuk satu data
    Route::post('/jadwal/batch', [JadwalController::class, 'storeBatch']); // <-- Tambahkan ini untuk banyak data
    Route::delete('/jadwal/by-voyage', [JadwalController::class, 'destroyByVoyage']);
});

Route::post('/login', [AuthController::class, 'login']);
