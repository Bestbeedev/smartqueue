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
        public ?string $ticketNumber = null,
        public bool $confirmedPresence = false,
        public ?int $lastDistanceM = null,
    ) {
        Log::info('[UserEnRoute] Event constructed', [
            'ticket_id' => $this->ticketId,
            'service_id' => $this->serviceId,
            'broadcast_connection' => config('broadcasting.default'),
            'reverb_host' => config('broadcasting.connections.pusher.options.host'),
            'reverb_key' => config('broadcasting.connections.pusher.key'),
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
        $isPresenceConfirmed = $this->confirmedPresence || !$this->estimatedMinutes;

        $data = [
            'ticket_id' => $this->ticketId,
            'ticket_number' => $this->ticketNumber,
            'estimated_minutes' => $this->estimatedMinutes,
            'last_distance_m' => $this->lastDistanceM,
            'confirmed_presence' => $isPresenceConfirmed,
            'message' => $isPresenceConfirmed
                ? "L'usager a confirmé sa présence"
                : "L'usager arrive dans ~{$this->estimatedMinutes} min",
        ];
        Log::info('[UserEnRoute] broadcastWith called', $data);
        return $data;
    }
}
