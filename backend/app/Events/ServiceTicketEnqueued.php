<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;

class ServiceTicketEnqueued implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $serviceId, public array $data = [])
    {
    }

    public function broadcastAs(): string
    {
        return 'service.ticket.enqueued';
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('service.'.$this->serviceId)];
    }

    public function broadcastWith(): array
    {
        return $this->data;
    }
}
