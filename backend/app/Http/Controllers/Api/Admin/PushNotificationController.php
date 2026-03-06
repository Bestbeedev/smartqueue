<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendPushNotification;
use App\Models\Device;
use Illuminate\Http\Request;

class PushNotificationController extends Controller
{
    /**
     * Broadcast a push notification to all registered devices.
     *
     * This endpoint is intended for establishment admins to publish announcements
     * to all mobile app users.
     */
    public function broadcast(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:500'],
            'data' => ['sometimes', 'array'],
        ]);

        $payload = is_array($data['data'] ?? null) ? $data['data'] : [];
        $payload['type'] = $payload['type'] ?? 'admin_broadcast';

        // Dispatch to each distinct user that has at least one push-enabled device.
        $userIds = Device::query()
            ->where('push_enabled', true)
            ->distinct()
            ->pluck('user_id')
            ->all();

        foreach ($userIds as $userId) {
            dispatch(new SendPushNotification((int) $userId, $data['title'], $data['body'], $payload));
        }

        return response()->json([
            'message' => 'Broadcast queued',
            'users_targeted' => count($userIds),
        ]);
    }
}
