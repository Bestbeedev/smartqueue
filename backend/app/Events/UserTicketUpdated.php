<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTicketUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $userId, public array $data = [])
    {
        //
    }

    public function broadcastAs(): string
    {
        return 'user.ticket.updated';
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('private-user.'.$this->userId)];
    }

    public function broadcastWith(): array
    {
        return $this->data;
    }
}
