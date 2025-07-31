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
        Schema::table('perjalanans', function (Blueprint $table) {
            // Menambahkan kolom setelah 'id'
            $table->string('nama_kapal', 100)->after('id');
            $table->string('voyage', 50)->after('nama_kapal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perjalanans', function (Blueprint $table) {
            $table->dropColumn(['voyage', 'nama_kapal']);
        });
    }
};
