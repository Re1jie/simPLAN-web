<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Docking extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_kapal',
        'waktu_mulai_docking',
        'waktu_selesai_docking',
        'detail_docking',
    ];

    protected $casts = [
        'waktu_mulai_docking' => 'date',
        'waktu_selesai_docking' => 'date',
    ];
}
