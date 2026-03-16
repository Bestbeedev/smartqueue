<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserEnRoute implements ShouldBroadcastNow
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
        // Broadcast to presence channel for agents
        // Laravel adds 'presence-' prefix automatically for PresenceChannel
        \Log::info('[UserEnRoute] Broadcasting to presence-service.'.$this->serviceId, [
            'ticket_id' => $this->ticketId,
            'ticket_number' => $this->ticketNumber,
        ]);
        return [
            new PresenceChannel('service.'.$this->serviceId),
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
