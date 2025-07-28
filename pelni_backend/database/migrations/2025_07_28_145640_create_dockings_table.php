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
        Schema::create('dockings', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kapal');
            $table->date('waktu_mulai_docking');
            $table->date('waktu_selesai_docking');
            $table->string('detail_docking');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dockings');
    }
};
