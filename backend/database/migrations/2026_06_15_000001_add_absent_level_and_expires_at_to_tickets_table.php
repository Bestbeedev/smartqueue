<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->unsignedTinyInteger('absent_level')->default(0)->after('deferral_count');
            $table->timestamp('absent_expires_at')->nullable()->after('absent_at');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('absent_level');
            $table->dropColumn('absent_expires_at');
        });
    }
};
