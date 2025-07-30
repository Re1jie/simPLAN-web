<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanPublic extends Model
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
    ];
    protected $casts = [
        'waktu_tiba' => 'datetime',
        'waktu_berangkat' => 'datetime',
    ];
}
