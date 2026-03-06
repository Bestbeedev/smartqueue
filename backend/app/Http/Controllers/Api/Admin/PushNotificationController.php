<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendPushNotification;
use App\Models\Device;
use App\Models\NotificationLog;
use App\Models\User;
use App\Notifications\AdminBroadcastNotification;
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

        $users = User::query()->whereIn('id', $userIds)->get();
        foreach ($users as $u) {
            $u->notify(new AdminBroadcastNotification($data['title'], $data['body'], $payload));
            dispatch(new SendPushNotification((int) $u->id, $data['title'], $data['body'], $payload));
        }

        NotificationLog::create([
            'ticket_id' => null,
            'channel' => 'push',
            'type' => $payload['type'] ?? 'admin_broadcast',
            'status' => 'queued',
            'payload' => [
                'title' => $data['title'],
                'body' => $data['body'],
                'data' => $payload,
                'users_targeted' => $users->count(),
            ],
            'sent_at' => null,
        ]);

        return response()->json([
            'message' => 'Broadcast queued',
            'users_targeted' => $users->count(),
        ]);
    }
}
