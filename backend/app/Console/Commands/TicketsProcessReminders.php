<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\ReminderEngine;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class TicketsProcessReminders extends Command
{
    protected $signature = 'tickets:process-reminders {--service_id=} {--dry-run}';

    protected $description = 'Send progressive, context-aware reminders (prepare/imminent/next) to waiting users based on their live position and ETA';

    public function __construct(
        private ReminderEngine $engine,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $serviceId = $this->option('service_id');
        $dryRun = (bool) $this->option('dry-run');

        $query = Ticket::query()
            ->with(['user', 'service'])
            ->where('status', 'waiting')
            ->whereDate('valid_date', Carbon::today())
            ->whereNotNull('position');

        if (! empty($serviceId)) {
            $query->where('service_id', (int) $serviceId);
        }

        $tickets = $query
            ->orderBy('service_id')
            ->orderBy('position')
            ->limit(2000)
            ->get();

        $processed = 0;
        $sent = 0;

        foreach ($tickets as $ticket) {
            $processed++;
            $stage = $this->engine->processTicket($ticket, $dryRun);

            if ($stage !== null) {
                $sent++;
                if ($dryRun) {
                    $this->line('[dry-run] stage='.$stage.' user_id='.$ticket->user_id.' ticket_id='.$ticket->id.' service_id='.$ticket->service_id.' pos='.$ticket->position);
                }
            }
        }

        $this->info('Processed='.$processed.' Sent='.$sent);

        return self::SUCCESS;
    }
}
