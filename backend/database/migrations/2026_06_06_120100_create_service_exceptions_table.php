<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            // The date the exception applies to. With recurring_yearly=true, only month-day is meaningful.
            $table->date('date');
            // holiday | closure | unavailable — label only; behavior is driven by is_closed + time window
            $table->string('type', 32)->default('holiday');
            $table->string('label', 160)->nullable();
            // Full-day closure when true. When false, only the time window is unavailable.
            $table->boolean('is_closed')->default(true);
            // Optional time window for partial-day unavailability (only used when is_closed=false)
            $table->time('starts_at')->nullable();
            $table->time('ends_at')->nullable();
            // Recurring yearly (e.g. Jan 1, May 1). When true, year part of `date` is ignored at evaluation.
            $table->boolean('recurring_yearly')->default(false);
            $table->timestamps();

            $table->index(['service_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_exceptions');
    }
};
