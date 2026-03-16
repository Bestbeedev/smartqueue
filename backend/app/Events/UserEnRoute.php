<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserEnRoute implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $ticketId,
        public int $serviceId,
        public ?int $estimatedMinutes = null,
        public ?string $ticketNumber = null
    ) {
        //
    }

    public function broadcastAs(): string
    {
        return 'user.en_route';
    }

    public function broadcastOn(): array
    {
        // Broadcast to presence channel for agents (matches frontend echo.join)
        return [
            new PresenceChannel('presence-service.'.$this->serviceId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticketId,
            'ticket_number' => $this->ticketNumber,
            'estimated_minutes' => $this->estimatedMinutes,
            'message' => $this->estimatedMinutes 
                ? "L'usager arrive dans ~{$this->estimatedMinutes} min"
                : "L'usager a confirmé sa présence",
        ];
    }
}
