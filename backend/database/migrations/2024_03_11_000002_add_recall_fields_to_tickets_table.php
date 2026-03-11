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
            // Track if user has used their one-time recall
            $table->boolean('has_recalled')->default(false);
            
            // When the ticket was called (for countdown calculation)
            $table->timestamp('called_at')->nullable();
            
            // When the user confirmed they're on their way
            $table->timestamp('en_route_at')->nullable();
            
            // Estimated travel time when user clicked "en route"
            $table->unsignedInteger('estimated_travel_minutes')->nullable();
            
            // Counter number when called
            $table->unsignedInteger('called_counter_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn([
                'has_recalled',
                'called_at',
                'en_route_at',
                'estimated_travel_minutes',
                'called_counter_id',
            ]);
        });
    }
};
