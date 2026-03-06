<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendPushNotification;
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

        // La cloche/dashboard doit afficher le broadcast pour tous les users du même établissement.
        // En revanche, l'envoi FCM doit rester limité aux users ayant au moins un device push_enabled.
        $admin = $request->user();
        $establishmentId = (int) ($admin->establishment_id ?? 0);

        $establishmentUsers = User::query()
            ->where('establishment_id', $establishmentId)
            ->get();

        foreach ($establishmentUsers as $u) {
            $u->notify(new AdminBroadcastNotification($data['title'], $data['body'], $payload));
        }

        $pushUserIds = User::query()
            ->whereHas('devices', function ($q) {
                $q->where('push_enabled', true);
            })
            ->pluck('id')
            ->all();

        foreach ($pushUserIds as $userId) {
            dispatch(new SendPushNotification((int) $userId, $data['title'], $data['body'], $payload));
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
                'establishment_users_notified' => $establishmentUsers->count(),
                'push_users_targeted' => count($pushUserIds),
            ],
            'sent_at' => null,
        ]);

        return response()->json([
            'message' => 'Broadcast queued',
            'establishment_users_notified' => $establishmentUsers->count(),
            'push_users_targeted' => count($pushUserIds),
        ]);
    }
}
