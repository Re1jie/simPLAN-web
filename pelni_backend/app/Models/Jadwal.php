<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    use HasFactory;

    /**
     * Atribut yang bisa diisi secara massal.
     *
     * @var array
     */
    protected $fillable = [
        'voyage',
        'nama_kapal',
        'rute',
        'pelabuhan',
        'waktu_tiba',
        'waktu_berangkat',
        'kecepatan',
        'jarak',
        'faktor_pasang_surut',
        'jam_labuh',
    ];
    protected $casts = [
        'waktu_tiba' => 'datetime',
        'waktu_berangkat' => 'datetime',
    ];
}
