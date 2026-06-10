<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('priority_mode', 20)->default('immediate')->after('priority_support');
            $table->unsignedSmallInteger('priority_weighted_ratio')->default(5)->after('priority_mode');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['priority_mode', 'priority_weighted_ratio']);
        });
    }
};
