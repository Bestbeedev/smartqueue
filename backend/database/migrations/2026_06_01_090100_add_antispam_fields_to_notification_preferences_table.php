<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            // Quiet hours: non-critical reminders are skipped between these times (HH:MM, 24h).
            $table->string('quiet_hours_start', 5)->nullable()->after('notify_before_minutes');
            $table->string('quiet_hours_end', 5)->nullable()->after('quiet_hours_start');

            // Minimum minutes between two pushed reminders for the same ticket.
            $table->unsignedInteger('min_interval_minutes')->default(5)->after('quiet_hours_end');

            // Hard cap on the number of reminders sent for a single ticket.
            $table->unsignedInteger('max_reminders_per_ticket')->default(4)->after('min_interval_minutes');

            // Allow server-side "leave now" (travel-aware) reminders (used by a later lot).
            $table->boolean('enable_travel_alerts')->default(true)->after('max_reminders_per_ticket');
        });
    }

    public function down(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->dropColumn([
                'quiet_hours_start',
                'quiet_hours_end',
                'min_interval_minutes',
                'max_reminders_per_ticket',
                'enable_travel_alerts',
            ]);
        });
    }
};
