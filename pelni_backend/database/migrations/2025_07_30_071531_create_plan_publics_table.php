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
        Schema::create('plan_publics', function (Blueprint $table) {
            $table->id();
            $table->integer('voyage');
            $table->string('nama_kapal');
            $table->string('rute')->nullable();
            $table->string('pelabuhan');
            $table->dateTime('waktu_tiba');
            $table->dateTime('waktu_berangkat')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_publics');
    }
};
