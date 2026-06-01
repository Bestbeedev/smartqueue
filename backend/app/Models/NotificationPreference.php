<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'push_enabled',
        'sms_enabled',
        'notify_before_positions',
        'notify_before_minutes',
        'quiet_hours_start',
        'quiet_hours_end',
        'min_interval_minutes',
        'max_reminders_per_ticket',
        'enable_travel_alerts',
        'last_notified_ticket_id',
        'last_notified_at',
    ];

    protected $casts = [
        'push_enabled' => 'boolean',
        'sms_enabled' => 'boolean',
        'notify_before_positions' => 'integer',
        'notify_before_minutes' => 'integer',
        'min_interval_minutes' => 'integer',
        'max_reminders_per_ticket' => 'integer',
        'enable_travel_alerts' => 'boolean',
        'last_notified_ticket_id' => 'integer',
        'last_notified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
