<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\Request;

class NotificationPreferencesController extends Controller
{
    // GET /api/notification-preferences
    public function show(Request $request)
    {
        $prefs = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            [
                'push_enabled' => true,
                'sms_enabled' => false,
                'notify_before_positions' => 3,
                'notify_before_minutes' => 10,
            ]
        );

        return response()->json([
            'data' => $prefs,
        ]);
    }

    // PUT /api/notification-preferences
    public function update(Request $request)
    {
        $data = $request->validate([
            'push_enabled' => ['sometimes','boolean'],
            'sms_enabled' => ['sometimes','boolean'],
            'notify_before_positions' => ['sometimes','integer','min:0','max:999'],
            'notify_before_minutes' => ['sometimes','integer','min:0','max:999'],
            'quiet_hours_start' => ['sometimes','nullable','date_format:H:i'],
            'quiet_hours_end' => ['sometimes','nullable','date_format:H:i'],
            'min_interval_minutes' => ['sometimes','integer','min:1','max:240'],
            'max_reminders_per_ticket' => ['sometimes','integer','min:1','max:20'],
            'enable_travel_alerts' => ['sometimes','boolean'],
        ]);

        $prefs = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            [
                'push_enabled' => true,
                'sms_enabled' => false,
                'notify_before_positions' => 3,
                'notify_before_minutes' => 10,
            ]
        );

        $prefs->fill($data);
        $prefs->save();

        return response()->json([
            'data' => $prefs->fresh(),
        ]);
    }
}
