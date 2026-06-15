<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class TicketsExpireCalled extends Command
{
    protected $signature = 'tickets:expire-called {--dry-run}';
    protected $description = 'Auto-absent on first call expiry; permanent expiry on second call expiry (deferral_count >= 1)';

    public function __construct(
        private TicketService $ticketService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $now    = Carbon::now();

        $fallbackThreshold = $now->copy()->subSeconds((int) config('queue.call_timeout_seconds', 600));

        // Find all called tickets whose call window has expired
        $calledTickets = Ticket::query()
            ->with(['user', 'service'])
            ->where('status', 'called')
            ->where(function ($q) use ($now, $fallbackThreshold) {
                $q->where(function ($sub) use ($now) {
                    $sub->whereNotNull('called_expires_at')
                        ->where('called_expires_at', '<=', $now);
                })->orWhere(function ($sub) use ($fallbackThreshold) {
                    $sub->whereNull('called_expires_at')
                        ->whereNotNull('called_at')
                        ->where('called_at', '<=', $fallbackThreshold);
                });
            })
            ->get();

        $this->info(($dryRun ? '[dry-run] ' : '') . "Called tickets expired: {$calledTickets->count()}");

        if ($dryRun) {
            return self::SUCCESS;
        }

        $affectedServiceIds = collect();

        foreach ($calledTickets as $ticket) {
            $affectedServiceIds->push($ticket->service_id);

            if (($ticket->deferral_count ?? 0) >= 1) {
                // Second call timeout: the agent already gave one recall — permanent expiry
                $this->ticketService->permanentlyExpireAbsent($ticket);
            } else {
                // First call timeout: mark absent, agent can still recall
                $this->ticketService->markAbsent($ticket);
            }
        }

        foreach ($affectedServiceIds->unique() as $serviceId) {
            $service = \App\Models\Service::find($serviceId);
            if ($service) {
                $this->ticketService->recomputePositions($service);
            }
        }

        return self::SUCCESS;
    }
}
