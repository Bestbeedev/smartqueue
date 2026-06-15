<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class TicketsExpireCalled extends Command
{
    protected $signature = 'tickets:expire-called {--dry-run}';
    protected $description = 'Two-strike absence system: auto-absent on 1st expiry, permanent expiry on 2nd';

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

        // ── 1. Called tickets whose call window has expired → auto-absent (two-strike) ──
        $calledQuery = Ticket::query()
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

        $calledTickets = $calledQuery->get();
        $this->info(($dryRun ? '[dry-run] ' : '') . "Called tickets to auto-absent: {$calledTickets->count()}");

        // ── 2. Definitively absent tickets (deferral_count >= 2) whose timer expired ──
        $absentQuery = Ticket::query()
            ->with(['user', 'service'])
            ->where('status', 'absent')
            ->where('deferral_count', '>=', 2)
            ->whereNotNull('called_expires_at')
            ->where('called_expires_at', '<=', $now);

        $absentTickets = $absentQuery->get();
        $this->info(($dryRun ? '[dry-run] ' : '') . "Absent tickets to permanently expire: {$absentTickets->count()}");

        if ($dryRun) {
            return self::SUCCESS;
        }

        $affectedServiceIds = collect();

        foreach ($calledTickets as $ticket) {
            $affectedServiceIds->push($ticket->service_id);
            // markAbsent() handles two-strike automatically via deferral_count
            $this->ticketService->markAbsent($ticket);
        }

        foreach ($absentTickets as $ticket) {
            $affectedServiceIds->push($ticket->service_id);
            $this->ticketService->permanentlyExpireAbsent($ticket);
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
