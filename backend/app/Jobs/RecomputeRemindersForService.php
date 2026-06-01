<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Services\ReminderEngine;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;

/**
 * Re-evaluate reminders for all waiting tickets of a service right after the
 * queue changed (call/absent/cancel/close/priority/defer), so reminders react
 * immediately instead of waiting for the next cron tick.
 *
 * Safe to run concurrently with the cron command: the UNIQUE(ticket_id, stage)
 * constraint in the ReminderEngine guarantees no duplicate reminders.
 */
class RecomputeRemindersForService implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 60;

    public function __construct(public int $serviceId) {}

    public function handle(ReminderEngine $engine): void
    {
        $tickets = Ticket::query()
            ->with(['user', 'service'])
            ->where('service_id', $this->serviceId)
            ->where('status', 'waiting')
            ->whereDate('valid_date', Carbon::today())
            ->whereNotNull('position')
            ->orderBy('position')
            ->limit(2000)
            ->get();

        foreach ($tickets as $ticket) {
            $engine->processTicket($ticket);
        }
    }
}
