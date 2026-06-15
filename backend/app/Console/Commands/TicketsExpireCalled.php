<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class TicketsExpireCalled extends Command
{
    protected $signature = 'tickets:expire-called {--dry-run}';
    protected $description = 'Mark called tickets as absent on expiry, or close definitively when attempts exhausted';

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

        // Niveau 2 absents : tickets en absence définitive dont le délai d'expiration est écoulé
        $absentExpiring = Ticket::query()
            ->with(['user', 'service'])
            ->where('status', 'absent')
            ->where('absent_level', '>=', 2)
            ->whereNotNull('absent_expires_at')
            ->where('absent_expires_at', '<=', $now)
            ->get();

        $this->info(($dryRun ? '[dry-run] ' : '') . "Absent level 2 expired: {$absentExpiring->count()}");

        if ($dryRun) {
            return self::SUCCESS;
        }

        $affectedServiceIds = collect();

        foreach ($calledTickets as $ticket) {
            $affectedServiceIds->push($ticket->service_id);

            $maxAttempts = (int) ($ticket->service?->max_call_attempts ?? 2);

            if (($ticket->deferral_count ?? 0) >= $maxAttempts) {
                // At or beyond max attempts — permanent expiry
                $this->ticketService->permanentlyExpireAbsent($ticket);
            } else {
                // Still has attempts left — mark absent (agent can still recall)
                $this->ticketService->markAbsent($ticket);
            }
        }

        // Expirer les absents de niveau 2 dont le délai est écoulé
        foreach ($absentExpiring as $ticket) {
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
