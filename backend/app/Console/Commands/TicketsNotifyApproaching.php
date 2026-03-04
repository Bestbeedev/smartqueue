<?php

namespace App\Console\Commands;

use App\Jobs\SendPushNotification;
use App\Jobs\SendSmsNotification;
use App\Models\NotificationPreference;
use App\Models\Ticket;
use Illuminate\Support\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TicketsNotifyApproaching extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:notify-approaching {--service_id=} {--dry-run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Notify users when their ticket is approaching (by position or ETA)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $serviceId = $this->option('service_id');
        $dryRun = (bool) $this->option('dry-run');

        $now = Carbon::now();

        $ticketsQuery = Ticket::query()
            ->with(['user', 'service'])
            ->where('status', 'waiting')
            ->where('created_at', '>=', $now->copy()->subHours(24))
            ->whereNotNull('position');

        if (!empty($serviceId)) {
            $ticketsQuery->where('service_id', (int) $serviceId);
        }

        $tickets = $ticketsQuery
            ->orderBy('service_id')
            ->orderBy('position')
            ->limit(2000)
            ->get();

        $processed = 0;
        $notified = 0;

        foreach ($tickets as $ticket) {
            $processed++;

            if (!$ticket->user || !$ticket->service) {
                continue;
            }

            $prefs = NotificationPreference::query()->firstOrCreate(
                ['user_id' => $ticket->user->id],
                [
                    'push_enabled' => true,
                    'sms_enabled' => false,
                    'notify_before_positions' => 3,
                    'notify_before_minutes' => 10,
                ]
            );

            $shouldByPosition = $ticket->position <= (int) $prefs->notify_before_positions;
            $etaMinutes = $this->estimateEtaMinutesForTicket($ticket);
            $shouldByEta = $etaMinutes !== null && $etaMinutes <= (int) $prefs->notify_before_minutes;

            if (!$shouldByPosition && !$shouldByEta) {
                continue;
            }

            if ($this->wasRecentlyNotifiedForTicket($prefs, $ticket->id, $now)) {
                continue;
            }

            $title = 'Bientôt votre tour';
            $body = $shouldByPosition
                ? ('Vous êtes bientôt appelé (position '.$ticket->position.').')
                : ('Votre tour approche (≈ '.$etaMinutes.' min).');

            if ($dryRun) {
                $this->line('[dry-run] notify user_id='.$ticket->user->id.' ticket_id='.$ticket->id.' service_id='.$ticket->service_id.' pos='.$ticket->position.' eta='.(string) $etaMinutes);
                $this->markNotified($prefs, $ticket->id, $now, false);
                $notified++;
                continue;
            }

            if ($prefs->push_enabled) {
                dispatch(new SendPushNotification($ticket->user->id, $title, $body, [
                    'type' => 'approaching',
                    'ticket_id' => $ticket->id,
                    'service_id' => $ticket->service_id,
                    'position' => $ticket->position,
                    'eta_minutes' => $etaMinutes,
                ]));
            }

            if ($prefs->sms_enabled && !empty($ticket->user->phone)) {
                dispatch(new SendSmsNotification(
                    $ticket->user->phone,
                    $body.' Ticket '.$ticket->number,
                    [
                        'type' => 'approaching',
                        'ticket_id' => $ticket->id,
                        'service_id' => $ticket->service_id,
                    ]
                ));
            }

            $this->markNotified($prefs, $ticket->id, $now, true);
            $notified++;
        }

        $this->info('Processed='.$processed.' Notified='.$notified);
        return self::SUCCESS;
    }

    private function wasRecentlyNotifiedForTicket(NotificationPreference $prefs, int $ticketId, Carbon $now): bool
    {
        if ((int) $prefs->last_notified_ticket_id !== (int) $ticketId) {
            return false;
        }
        if (empty($prefs->last_notified_at)) {
            return false;
        }
        return $prefs->last_notified_at->greaterThan($now->copy()->subMinutes(20));
    }

    private function markNotified(NotificationPreference $prefs, int $ticketId, Carbon $now, bool $persist): void
    {
        $prefs->last_notified_ticket_id = $ticketId;
        $prefs->last_notified_at = $now;
        if ($persist) {
            $prefs->save();
        }
    }

    private function estimateEtaMinutesForTicket(Ticket $ticket): ?int
    {
        if ($ticket->position === null) {
            return null;
        }

        $avgMinutes = $this->estimateAvgServiceTimeMinutes($ticket->service_id, (int) $ticket->service->avg_service_time_minutes);
        if ($avgMinutes <= 0) {
            return null;
        }

        $ahead = max(0, ((int) $ticket->position) - 1);
        return (int) max(0, $ahead * $avgMinutes);
    }

    private function estimateAvgServiceTimeMinutes(int $serviceId, int $fallback): int
    {
        // Strategy C: A by default (service.avg_service_time_minutes), but B if enough samples.
        $rows = DB::table('tickets')
            ->where('service_id', $serviceId)
            ->whereNotNull('closed_at')
            ->whereNotNull('called_at')
            ->where('closed_at', '>=', now()->subDay())
            ->select(['called_at', 'closed_at'])
            ->limit(300)
            ->get();

        $sum = 0;
        $n = 0;
        foreach ($rows as $r) {
            $called = Carbon::parse($r->called_at);
            $closed = Carbon::parse($r->closed_at);
            if ($closed->greaterThan($called)) {
                $sum += $closed->diffInMinutes($called);
                $n++;
            }
        }

        if ($n >= 10) {
            return (int) max(1, (int) round($sum / $n));
        }

        return (int) max(1, $fallback);
    }
}
