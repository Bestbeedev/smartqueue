<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;

class ServiceTicketCalled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $serviceId, public array $data = [])
    {
    }

    public function broadcastAs(): string
    {
        return 'service.ticket.called';
    }

    public function broadcastOn(): array
    {
        // Laravel adds 'presence-' prefix automatically for PresenceChannel
        return [new PresenceChannel('service.'.$this->serviceId)];
    }

    public function broadcastWith(): array
    {
        return $this->data;
    }
}
