<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_working_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            // ISO day of week: 1=Monday ... 7=Sunday
            $table->unsignedTinyInteger('day_of_week');
            $table->boolean('is_open')->default(true);
            // Optional per-day overrides; if NULL, the service-level opening_time/closing_time is used
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->timestamps();

            $table->unique(['service_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_working_days');
    }
};
