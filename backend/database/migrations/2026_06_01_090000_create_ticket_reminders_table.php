<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Progressive reminder stage: prepare | leave | imminent | next
            $table->string('stage', 16);

            // Channel used to deliver this stage: push | sms | realtime
            $table->string('channel', 16)->default('push');

            // Context snapshot at send time (position, eta_minutes, travel_minutes, ...)
            $table->json('context')->nullable();

            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            // Idempotence: exactly one row per (ticket, stage) -> no duplicate reminders
            $table->unique(['ticket_id', 'stage']);
            // Anti-spam helper: look up the most recent reminder for a ticket quickly
            $table->index(['ticket_id', 'sent_at']);
            $table->index(['user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_reminders');
    }
};
