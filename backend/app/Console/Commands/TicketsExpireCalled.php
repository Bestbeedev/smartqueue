<?php

namespace App\Console\Commands;

use App\Jobs\SendPushNotification;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class TicketsExpireCalled extends Command
{
    protected $signature = 'tickets:expire-called {--dry-run}';
    protected $description = 'Expire called tickets whose call timeout has elapsed';

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
            ->with('user')
            ->where('status', 'called')
            ->where(function ($q) use ($now, $fallbackThreshold) {
                $q->where(function ($sub) use ($now) {
                    // Ticket has a specific expiry set by callNext()
                    $sub->whereNotNull('called_expires_at')
                        ->where('called_expires_at', '<=', $now);
                })->orWhere(function ($sub) use ($fallbackThreshold) {
                    // Legacy ticket without called_expires_at — use global config
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
            $this->ticketService->markAbsent($ticket);

            if ($ticket->user) {
                dispatch(new SendPushNotification(
                    $ticket->user->id,
                    'Ticket marqué absent',
                    'Votre ticket a été marqué absent car vous n\'avez pas répondu à l\'appel.',
                    [
                        'ticket_id' => $ticket->id,
                        'service_id' => $ticket->service_id,
                        'type' => 'called_expired',
                    ]
                ));
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
