<?php

namespace App\Services;

use App\Jobs\SendPushNotification;
use App\Jobs\SendSmsNotification;
use App\Models\NotificationPreference;
use App\Models\Ticket;
use App\Models\TicketReminder;
use Illuminate\Support\Carbon;

/**
 * Progressive, context-aware reminder engine.
 *
 * Computes the highest reminder "stage" a waiting ticket has reached
 * (prepare -> imminent -> next) from its live position / ETA, and sends
 * each stage at most once. Lower stages that are skipped (because the
 * ticket jumped ahead) are marked as superseded so the progression stays
 * strictly forward and never produces duplicate or out-of-order reminders.
 */
class ReminderEngine
{
    /**
     * Ordered stages (lowest urgency first). The array index is the rank.
     *
     * @var string[]
     */
    public const STAGES = ['prepare', 'imminent', 'next'];

    public function __construct(
        private TicketService $ticketService,
    ) {}

    /**
     * Evaluate one ticket and send the appropriate reminder stage if due.
     *
     * @return string|null The stage that was sent, or null if nothing was sent.
     */
    public function processTicket(Ticket $ticket, bool $dryRun = false): ?string
    {
        if ($ticket->status !== 'waiting' || $ticket->position === null) {
            return null;
        }
        if (! $ticket->user || ! $ticket->service) {
            return null;
        }

        $prefs = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $ticket->user_id],
            [
                'push_enabled' => true,
                'sms_enabled' => false,
                'notify_before_positions' => 3,
                'notify_before_minutes' => 10,
            ]
        );

        $etaMinutes = $this->ticketService->estimateWaitTime($ticket->service, $ticket);

        $targetIndex = $this->resolveTargetStageIndex($ticket, $prefs, $etaMinutes);
        if ($targetIndex === null) {
            return null;
        }

        $targetStage = self::STAGES[$targetIndex];

        // Already sent (or superseded) -> nothing to do.
        $alreadyHandled = TicketReminder::query()
            ->where('ticket_id', $ticket->id)
            ->where('stage', $targetStage)
            ->exists();
        if ($alreadyHandled) {
            return null;
        }

        // Global anti-spam: keep a minimum interval between two *pushed* reminders
        // for the same ticket. The terminal "next" stage is allowed to bypass it.
        if ($targetStage !== 'next' && $this->sentRecently($ticket->id, $prefs)) {
            return null;
        }

        if ($dryRun) {
            return $targetStage;
        }

        // Mark any skipped lower stages as superseded so they never fire later
        // (e.g. if the queue oscillates backward).
        $this->markSupersededBelow($ticket, $targetIndex);

        // Idempotent insert: the UNIQUE(ticket_id, stage) constraint guarantees
        // exactly-once even under concurrent cron/event-driven runs.
        $reminder = TicketReminder::query()->firstOrCreate(
            ['ticket_id' => $ticket->id, 'stage' => $targetStage],
            [
                'user_id' => $ticket->user_id,
                'channel' => 'push',
                'context' => [
                    'position' => $ticket->position,
                    'eta_minutes' => $etaMinutes,
                ],
                'sent_at' => Carbon::now(),
            ]
        );

        // Another worker already created (and sent) it between our checks.
        if (! $reminder->wasRecentlyCreated) {
            return null;
        }

        [$title, $body] = $this->messageFor($targetStage, $ticket->position, $etaMinutes);

        if ($prefs->push_enabled) {
            dispatch(new SendPushNotification($ticket->user_id, $title, $body, [
                'type' => 'reminder',
                'stage' => $targetStage,
                'ticket_id' => $ticket->id,
                'service_id' => $ticket->service_id,
                'position' => $ticket->position,
                'eta_minutes' => $etaMinutes,
            ]));
        }

        if ($prefs->sms_enabled && ! empty($ticket->user->phone)) {
            dispatch(new SendSmsNotification(
                $ticket->user->phone,
                $body.' Ticket '.$ticket->number,
                [
                    'type' => 'reminder',
                    'stage' => $targetStage,
                    'ticket_id' => $ticket->id,
                    'service_id' => $ticket->service_id,
                ]
            ));
        }

        // Keep legacy anti-spam fields in sync for backward compatibility.
        $prefs->last_notified_ticket_id = $ticket->id;
        $prefs->last_notified_at = Carbon::now();
        $prefs->save();

        return $targetStage;
    }

    /**
     * Highest stage the ticket currently qualifies for, or null if none.
     *
     * Thresholds are derived from the user's existing preferences so the
     * timing adapts to both position and the (dynamic) estimated wait time.
     */
    private function resolveTargetStageIndex(Ticket $ticket, NotificationPreference $prefs, int $etaMinutes): ?int
    {
        $pos = (int) $ticket->position;
        $posThreshold = max(1, (int) $prefs->notify_before_positions);
        $minThreshold = max(1, (int) $prefs->notify_before_minutes);

        // next: the user is first in line.
        if ($pos <= 1) {
            return 2;
        }
        // imminent: within the user's configured position/ETA window.
        if ($pos <= $posThreshold || $etaMinutes <= $minThreshold) {
            return 1;
        }
        // prepare: roughly twice the imminent window -> early heads-up.
        if ($pos <= $posThreshold * 2 || $etaMinutes <= $minThreshold * 2) {
            return 0;
        }

        return null;
    }

    private function sentRecently(int $ticketId, NotificationPreference $prefs): bool
    {
        $minInterval = $this->minIntervalMinutes($prefs);

        $last = TicketReminder::query()
            ->where('ticket_id', $ticketId)
            ->whereNotNull('sent_at')
            ->orderByDesc('sent_at')
            ->value('sent_at');

        if (empty($last)) {
            return false;
        }

        return Carbon::parse($last)->greaterThan(Carbon::now()->subMinutes($minInterval));
    }

    /**
     * Insert "superseded" markers (no push) for every lower, not-yet-handled
     * stage so the progression stays strictly forward.
     */
    private function markSupersededBelow(Ticket $ticket, int $targetIndex): void
    {
        for ($i = 0; $i < $targetIndex; $i++) {
            $stage = self::STAGES[$i];
            TicketReminder::query()->firstOrCreate(
                ['ticket_id' => $ticket->id, 'stage' => $stage],
                [
                    'user_id' => $ticket->user_id,
                    'channel' => 'superseded',
                    'context' => ['position' => $ticket->position],
                    'sent_at' => null,
                ]
            );
        }
    }

    private function minIntervalMinutes(NotificationPreference $prefs): int
    {
        // Falls back to a sane default when the column does not exist yet.
        $value = $prefs->getAttribute('min_interval_minutes');

        return $value !== null ? max(1, (int) $value) : 5;
    }

    /**
     * @return array{0:string,1:string} [title, body]
     */
    private function messageFor(string $stage, int $position, int $etaMinutes): array
    {
        return match ($stage) {
            'next' => [
                'Vous êtes le prochain',
                'Préparez-vous, vous allez être appelé d\'un instant à l\'autre.',
            ],
            'imminent' => [
                'Votre tour est imminent',
                'Plus que quelques personnes avant vous (position '.$position.', ≈ '.$etaMinutes.' min).',
            ],
            default => [
                'Préparez-vous, votre tour approche',
                'Vous êtes en position '.$position.' (≈ '.$etaMinutes.' min). Commencez à vous préparer.',
            ],
        };
    }
}
