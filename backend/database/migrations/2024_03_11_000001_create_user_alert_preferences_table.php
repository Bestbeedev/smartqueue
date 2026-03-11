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
        Schema::create('user_alert_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Alert channels - stored as JSON array ['push', 'sms'] or ['push'] etc.
            $table->json('channels')->default('["push"]');
            
            // Minutes before estimated turn to trigger alert
            $table->unsignedInteger('margin_minutes')->default(10);
            
            // Whether margin is custom or predefined (5, 10, 15, 20, 'custom')
            $table->string('margin_option', 20)->default('10');
            
            // Enable second safety alert 2 minutes before if not confirmed
            $table->boolean('enable_safety_alert')->default(false);
            
            // Phone number for SMS fallback
            $table->string('phone_number')->nullable();
            
            // Preferred transport mode for travel time calculation
            $table->enum('preferred_transport_mode', ['walking', 'motorcycle', 'car'])->default('motorcycle');
            
            $table->timestamps();
            
            // One preference record per user
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_alert_preferences');
    }
};
