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
