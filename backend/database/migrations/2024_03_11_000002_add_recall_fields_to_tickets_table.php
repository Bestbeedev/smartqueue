<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add recall (seconde chance) fields to tickets table.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Check if each column exists before adding (prevents duplicate column error)
            if (!Schema::hasColumn('tickets', 'has_recalled')) {
                $table->boolean('has_recalled')->default(false);
            }
            
            if (!Schema::hasColumn('tickets', 'called_at')) {
                $table->timestamp('called_at')->nullable();
            }
            
            if (!Schema::hasColumn('tickets', 'en_route_at')) {
                $table->timestamp('en_route_at')->nullable();
            }
            
            if (!Schema::hasColumn('tickets', 'estimated_travel_minutes')) {
                $table->unsignedInteger('estimated_travel_minutes')->nullable();
            }
            
            if (!Schema::hasColumn('tickets', 'called_counter_id')) {
                $table->unsignedInteger('called_counter_id')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('tickets', 'has_recalled')) {
                $columns[] = 'has_recalled';
            }
            if (Schema::hasColumn('tickets', 'called_at')) {
                $columns[] = 'called_at';
            }
            if (Schema::hasColumn('tickets', 'en_route_at')) {
                $columns[] = 'en_route_at';
            }
            if (Schema::hasColumn('tickets', 'estimated_travel_minutes')) {
                $columns[] = 'estimated_travel_minutes';
            }
            if (Schema::hasColumn('tickets', 'called_counter_id')) {
                $columns[] = 'called_counter_id';
            }
            
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
