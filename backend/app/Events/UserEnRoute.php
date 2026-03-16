<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UserEnRoute implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $ticketId,
        public int $serviceId,
        public ?int $estimatedMinutes = null,
        public ?string $ticketNumber = null
    ) {
        Log::info('[UserEnRoute] Event constructed', [
            'ticket_id' => $this->ticketId,
            'service_id' => $this->serviceId,
        ]);
    }

    public function broadcastAs(): string
    {
        Log::info('[UserEnRoute] broadcastAs called, returning: user.en_route');
        return 'user.en_route';
    }

    public function broadcastOn(): array
    {
        $channel = 'service.'.$this->serviceId;
        Log::info('[UserEnRoute] broadcastOn called', [
            'channel' => $channel,
            'final_channel' => 'presence-'.$channel,
        ]);
        return [
            new PresenceChannel($channel),
        ];
    }

    public function broadcastWith(): array
    {
        $data = [
            'ticket_id' => $this->ticketId,
            'ticket_number' => $this->ticketNumber,
            'estimated_minutes' => $this->estimatedMinutes,
            'message' => $this->estimatedMinutes 
                ? "L'usager arrive dans ~{$this->estimatedMinutes} min"
                : "L'usager a confirmé sa présence",
        ];
        Log::info('[UserEnRoute] broadcastWith called', $data);
        return $data;
    }
}
