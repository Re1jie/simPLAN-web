<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Perjalanan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_kapal',
        'voyage',
        'pelabuhan_dari',
        'pelabuhan_ke',
        'waktu_berangkat',
        'waktu_tiba',
        'faktor_labuh_mulai',
        'faktor_labuh_selesai',
        'total_faktor_labuh_menit',
        'jarak_tempuh',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'waktu_berangkat' => 'datetime',
        'waktu_tiba' => 'datetime',
        'faktor_labuh_mulai' => 'datetime',
        'faktor_labuh_selesai' => 'datetime',
    ];
}
