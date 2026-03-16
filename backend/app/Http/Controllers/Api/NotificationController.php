<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NotificationController extends Controller
{
    // GET /api/notifications?per_page=50
    public function index(Request $req)
    {
        $perPage = (int) $req->query('per_page', 50);
        $perPage = max(1, min($perPage, 100)); // bornes simples 1..100

        $items = $req->user()
            ->notifications()
            ->latest()
            ->limit($perPage)
            ->get()
            ->map(function ($notification) {
                // Transform to match frontend expected format
                $data = $notification->data;
                return [
                    'id' => $notification->id,
                    'user_id' => $notification->notifiable_id,
                    'title' => $data['title'] ?? 'Notification',
                    'message' => $data['message'] ?? '',
                    'type' => $data['type'] ?? 'info',
                    'data' => $data['data'] ?? [],
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                ];
            });

        return response()->json([
            'data' => $items,
        ]);
    }

    // GET /api/notifications/unread-count
    public function unreadCount(Request $req)
    {
        $count = $req->user()
            ->unreadNotifications()
            ->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    // POST /api/notifications/mark-all-read
    public function markAllRead(Request $req)
    {
        $req->user()
            ->unreadNotifications()
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Toutes les notifications ont été marquées comme lues',
        ]);
    }

    // POST /api/notifications/{id}/read
    public function read(Request $req, $id)
    {
        $n = $req->user()->notifications()->findOrFail($id);
        if (!$n->read_at) {
            $n->markAsRead(); // définit read_at = now()
        }
        return response()->noContent();
    }

    // DELETE /api/notifications/{id}
    public function destroy(Request $req, $id)
    {
        $n = $req->user()->notifications()->findOrFail($id);
        $n->delete();
        return response()->noContent();
    }
}
