<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class TicketsExpireCalled extends Command
{
    protected $signature = 'tickets:expire-called {--dry-run}';
    protected $description = 'Expire called tickets whose call timeout has elapsed (two-strike: defers on first expiry, marks absent on second)';

    public function __construct(
        private TicketService $ticketService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $now = Carbon::now();

        // Prefer per-ticket called_expires_at; fall back to global config for legacy tickets
        $fallbackThreshold = $now->copy()->subSeconds((int) config('queue.call_timeout_seconds', 600));

        $query = Ticket::query()
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
            });

        $tickets = $query->get();
        $this->info(($dryRun ? '[dry-run] ' : '') . 'Expiring called tickets: ' . $tickets->count());

        if ($dryRun) {
            return self::SUCCESS;
        }

        $affectedServiceIds = collect();

        foreach ($tickets as $ticket) {
            $affectedServiceIds->push($ticket->service_id);
            // Two-strike: defers on first expiry (deferral_count=0), marks absent on second.
            // markAbsentWithDeferral() internally calls markAbsent() when deferral not possible,
            // and each path already dispatches its own push notification — no duplicate here.
            $this->ticketService->markAbsentWithDeferral($ticket);
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
