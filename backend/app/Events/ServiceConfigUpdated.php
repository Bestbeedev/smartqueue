<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class ServiceConfigUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public array $config;
    public int $serviceId;

    public function __construct(int $serviceId, array $config)
    {
        $this->serviceId = $serviceId;
        $this->config = $config;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('service.' . $this->serviceId);
    }

    public function broadcastAs(): string
    {
        return 'ServiceConfigUpdated';
    }

    public function broadcastWith(): array
    {
        return $this->config;
    }
}
