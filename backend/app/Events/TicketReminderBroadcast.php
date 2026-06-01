<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Realtime smart-reminder pushed to the ticket owner so the app can show an
 * in-app banner while foregrounded (deduplicated against FCM by `stage`).
 */
class TicketReminderBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $userId, public array $data = [])
    {
        //
    }

    public function broadcastAs(): string
    {
        return 'ticket.reminder';
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastWith(): array
    {
        return $this->data;
    }
}
