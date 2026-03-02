<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'establishment_id')) {
                $table->foreignId('establishment_id')->nullable()->after('role')->constrained('establishments')->nullOnDelete();
                $table->index(['establishment_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'establishment_id')) {
                $table->dropIndex(['establishment_id']);
                $table->dropConstrainedForeignId('establishment_id');
            }
        });
    }
};
