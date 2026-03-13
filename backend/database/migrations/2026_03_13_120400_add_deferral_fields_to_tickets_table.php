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
        Schema::table('tickets', function (Blueprint $table) {
            // Track deferral/swapped status
            $table->timestamp('deferred_at')->nullable()->after('absent_at');
            $table->unsignedTinyInteger('deferral_count')->default(0)->after('deferred_at');
            $table->boolean('is_swapped')->default(false)->after('deferral_count');
            $table->unsignedBigInteger('swapped_with_ticket_id')->nullable()->after('is_swapped');
            $table->timestamp('original_called_at')->nullable()->after('swapped_with_ticket_id');
            $table->timestamp('grace_period_expires_at')->nullable()->after('original_called_at');
            
            // Index for faster queries on swapped tickets
            $table->index(['service_id', 'is_swapped', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn([
                'deferred_at',
                'deferral_count',
                'is_swapped',
                'swapped_with_ticket_id',
                'original_called_at',
                'grace_period_expires_at'
            ]);
            $table->dropIndex(['service_id', 'is_swapped', 'status']);
        });
    }
};
