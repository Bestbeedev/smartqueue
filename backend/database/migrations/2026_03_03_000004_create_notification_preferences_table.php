<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->boolean('push_enabled')->default(true);
            $table->boolean('sms_enabled')->default(false);

            // Notify when ticket is close either by position or ETA
            $table->unsignedInteger('notify_before_positions')->default(3);
            $table->unsignedInteger('notify_before_minutes')->default(10);

            // Anti-spam: track last time we sent an "approaching" notification for a ticket
            $table->unsignedBigInteger('last_notified_ticket_id')->nullable();
            $table->timestamp('last_notified_at')->nullable();

            $table->timestamps();

            $table->unique(['user_id']);
            $table->index(['push_enabled']);
            $table->index(['sms_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
