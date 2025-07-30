<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\DockingController;
use App\Http\Controllers\Api\PlanPublicController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/jadwal', [JadwalController::class, 'index']);
    Route::post('/jadwal', [JadwalController::class, 'store']);
    Route::get('/docking', [DockingController::class, 'index']);
    Route::post('/docking', [DockingController::class, 'store']);
    Route::post('/jadwal/batch', [JadwalController::class, 'storeBatch']);
    Route::delete('/jadwal/by-voyage', [JadwalController::class, 'destroyByVoyage']);
    Route::delete('/docking/{id}', [DockingController::class, 'destroy']);
    Route::get('/plan-public', [PlanPublicController::class, 'index']);
    Route::post('/plan-public/publish', [PlanPublicController::class, 'publish']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::post('/login', [AuthController::class, 'login']);
