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
        Schema::table('jadwals', function (Blueprint $table) {
            $table->float('kecepatan')->nullable()->after('rute');
            $table->float('jarak')->nullable()->after('kecepatan');
            $table->float('faktor_pasang_surut')->nullable()->after('jarak');
            $table->float('jam_labuh')->nullable()->after('faktor_pasang_surut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jadwals', function (Blueprint $table) {
            $table->dropColumn('kecepatan');
            $table->dropColumn('jarak');
            $table->dropColumn('faktor_pasang_surut');
            $table->dropColumn('jam_labuh');
        });
    }
};
