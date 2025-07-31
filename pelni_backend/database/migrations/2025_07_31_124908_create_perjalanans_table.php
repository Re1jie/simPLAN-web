<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('perjalanans', function (Blueprint $table) {
            $table->id(); // Ini setara dengan BIGINT AUTO_INCREMENT PRIMARY KEY
            $table->string('pelabuhan_dari', 100);
            $table->string('pelabuhan_ke', 100);

            // Kolom DATETIME untuk gabungan tanggal dan waktu
            $table->dateTime('waktu_berangkat');
            $table->dateTime('waktu_tiba');

            // Faktor labuh bisa jadi tidak selalu ada, jadi kita buat nullable()
            $table->dateTime('faktor_labuh_mulai')->nullable();
            $table->dateTime('faktor_labuh_selesai')->nullable();

            // Total faktor labuh dalam satuan menit agar mudah dikalkulasi
            $table->integer('total_faktor_labuh_menit')->default(0);

            // Jarak tempuh menggunakan integer
            $table->integer('jarak_tempuh');

            // Timestamps standar Laravel (created_at dan updated_at)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perjalanans');
    }
};
