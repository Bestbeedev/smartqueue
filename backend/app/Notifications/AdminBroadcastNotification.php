<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class AdminBroadcastNotification extends Notification
{
    use Queueable;

    public function __construct(public string $title, public string $body, public array $payload = []) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return array_merge($this->payload, [
            'title' => $this->title,
            'message' => $this->body,
            'type' => $this->payload['type'] ?? 'admin_broadcast',
            'category' => $this->payload['category'] ?? 'system',
        ]);
    }
}
