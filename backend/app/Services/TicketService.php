<?php

namespace App\Services;

use App\Events\TicketCalled;
use App\Events\TicketUpdated;
use App\Events\UserTicketUpdated;
use App\Events\ServiceStatsUpdated;
use App\Events\ServiceTicketCalled;
use App\Events\ServiceTicketAbsent;
use App\Events\ServiceTicketEnqueued;
use App\Jobs\SendPushNotification;
use App\Jobs\SendSmsNotification;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

class TicketService
{
    private const ACTIVE_STATUSES = ['waiting','called','absent'];

    private function recomputePositions(Service $service): void
    {
        $waiting = Ticket::query()
            ->where('service_id', $service->id)
            ->where('status', 'waiting')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'user_id', 'position']);

        $pos = 1;
        foreach ($waiting as $t) {
            if ((int) $t->position !== $pos) {
                Ticket::query()->where('id', $t->id)->update(['position' => $pos]);
                event(new TicketUpdated($t->id, ['position' => $pos]));
                event(new UserTicketUpdated($t->user_id, ['ticket_id' => $t->id, 'position' => $pos]));
            }
            $pos++;
        }

        $waitingCount = $pos - 1;
        event(new ServiceStatsUpdated($service->id, ['waiting_count' => $waitingCount]));
    }

    /**
     * Crée un ticket pour un service donné avec logique de position et numérotation.
     */
    public function createTicket(User $user, int $serviceId, ?float $lat = null, ?float $lng = null, ?string $fromQr = null): Ticket
    {
        $this->expireOldTicketsForServiceId($serviceId);

        $attempts = 0;
        $maxAttempts = 5;

        while (true) {
            $attempts++;

            try {
                return DB::transaction(function () use ($user, $serviceId, $lat, $lng) {
                    $service = Service::query()->findOrFail($serviceId);

            // Vérifier que le service est ouvert
            if ($service->status !== 'open') {
                abort(422, 'Service is closed');
            }

            // Vérifier la capacité max de la file (si définie)
            if (!is_null($service->capacity)) {
                $waitingCount = Ticket::query()
                    ->where('service_id', $serviceId)
                    ->where('status', 'waiting')
                    ->count();
                if ($waitingCount >= (int) $service->capacity) {
                    abort(422, 'Service queue is full');
                }
            }

            // Empêcher plusieurs tickets actifs pour le même service et utilisateur
            $already = Ticket::query()
                ->where('user_id', $user->id)
                ->where('service_id', $serviceId)
                ->whereIn('status', ['waiting','called','absent'])
                ->exists();
            if ($already) {
                abort(422, 'You already have an active ticket for this service');
            }

            // Génération d'un numéro lisible (jour + incrément local au service)
            $prefix = strtoupper(substr($service->name, 0, 1));
            $today = Carbon::now()->format('Ymd');
            $last = Ticket::query()
                ->where('service_id', $serviceId)
                ->whereDate('created_at', Carbon::today())
                ->orderByDesc('id')
                ->value('number');
            $seq = 1;
            if ($last && preg_match('/^[A-Z]-(\d+)-'.$today.'$/', $last, $m)) {
                $seq = ((int) $m[1]) + 1;
            }
            $number = sprintf('%s-%03d-%s', $prefix, $seq, $today);

            // Position = nombre de waiting actuelle + 1
            $position = Ticket::query()
                ->where('service_id', $serviceId)
                ->where('status', 'waiting')
                ->count() + 1;

                    $ticket = Ticket::create([
                        'user_id' => $user->id,
                        'service_id' => $serviceId,
                        'number' => $number,
                        'status' => 'waiting',
                        'priority' => 'normal',
                        'position' => $position,
                        'last_distance_m' => $this->estimateDistanceMeters($lat, $lng, $service),
                        'last_seen_at' => Carbon::now(),
                    ]);

            // Broadcast mise à jour initiale
            event(new TicketUpdated($ticket->id, [
                'status' => $ticket->status,
                'position' => $ticket->position,
            ]));

            event(new UserTicketUpdated($user->id, [
                'ticket_id' => $ticket->id,
                'service_id' => $service->id,
                'status' => $ticket->status,
                'position' => $ticket->position,
            ]));

            // Diffusion sur le canal de présence du service: nouveau ticket en file
            event(new ServiceTicketEnqueued($service->id, [
                'ticket' => [
                    'id' => $ticket->id,
                    'number' => $ticket->number,
                    'priority' => $ticket->priority,
                ]
            ]));

            // Mise à jour des stats de file
            $this->recomputePositions($service);

                    return $ticket->fresh(['service.establishment']);
                });
            } catch (QueryException $e) {
                $isUniqueViolation = ($e->getCode() === '23000');
                if ($isUniqueViolation && $attempts < $maxAttempts) {
                    usleep(50000);
                    continue;
                }
                throw $e;
            }
        }
    }

    /**
     * Appelle le prochain ticket prêt pour un service (priorité > ancienneté).
     */
    public function callNext(Service $service, ?int $counterId = null): ?Ticket
    {
        return DB::transaction(function () use ($service, $counterId) {
            $this->expireOldTicketsForService($service);

            // Sélection du prochain ticket waiting
            $ticket = Ticket::query()
                ->where('service_id', $service->id)
                ->where('status', 'waiting')
                ->where('created_at', '>=', Carbon::now()->subHours(24))
                ->orderByRaw("CASE priority WHEN 'vip' THEN 3 WHEN 'high' THEN 2 ELSE 1 END DESC")
                ->orderBy('created_at')
                ->lockForUpdate()
                ->first();

            if (!$ticket) {
                return null;
            }

            $ticket->status = 'called';
            if (!is_null($counterId)) {
                $ticket->counter_id = $counterId;
            }
            $ticket->called_at = Carbon::now();
            $ticket->save();

            // Diffusion: ticket appelé
            event(new TicketCalled($ticket->id, [
                'number' => $ticket->number,
            ]));
            event(new TicketUpdated($ticket->id, [
                'status' => $ticket->status,
            ]));

            if ($ticket->user) {
                event(new UserTicketUpdated($ticket->user->id, [
                    'ticket_id' => $ticket->id,
                    'service_id' => $service->id,
                    'status' => $ticket->status,
                    'number' => $ticket->number,
                    'counter_id' => $ticket->counter_id,
                ]));
            }

            // Diffusion service: ticket appelé
            event(new ServiceTicketCalled($service->id, [
                'ticket' => [
                    'id' => $ticket->id,
                    'number' => $ticket->number,
                ]
            ]));

            // Notifications push & SMS (asynchrones via queue)
            if ($ticket->user) {
                dispatch(new SendPushNotification($ticket->user->id, 'Vous êtes appelé', 'Présentez-vous au guichet', [
                    'ticket_id' => $ticket->id,
                    'service_id' => $service->id,
                ]));
                if (!empty($ticket->user->phone)) {
                    dispatch(new SendSmsNotification($ticket->user->phone, 'Vous êtes appelé pour le ticket '.$ticket->number, [
                        'ticket_id' => $ticket->id,
                    ]));
                }
            }

            // Recalcul des positions restantes
            $this->recomputePositions($service);

            return $ticket->fresh(['service.establishment']);
        });
    }

    /**
     * Marque un ticket absent et notifie.
     */
    public function markAbsent(Ticket $ticket): Ticket
    {
        $this->expireOldTicketsForServiceId($ticket->service_id);

        $ticket->status = 'absent';
        $ticket->absent_at = Carbon::now();
        $ticket->save();

        event(new TicketUpdated($ticket->id, ['status' => $ticket->status]));

        if ($ticket->user) {
            event(new UserTicketUpdated($ticket->user->id, [
                'ticket_id' => $ticket->id,
                'service_id' => $ticket->service_id,
                'status' => $ticket->status,
            ]));
        }

        // Diffusion service: ticket marqué absent
        event(new ServiceTicketAbsent($ticket->service_id, [
            'ticket' => [
                'id' => $ticket->id,
                'number' => $ticket->number,
            ]
        ]));

        if ($ticket->user && !empty($ticket->user->phone)) {
            dispatch(new SendSmsNotification($ticket->user->phone, 'Vous avez été marqué absent pour le ticket '.$ticket->number));
        }

        $this->recomputePositions($ticket->service);
        return $ticket->fresh();
    }

    /**
     * Défère un ticket appelé : échange sa position avec le ticket suivant.
     * Le ticket déferré redevient "waiting" avec la position du suivant.
     * Le ticket suivant est appelé à la place.
     * Valable pendant 24h après l'appel original.
     */
    public function deferCalledTicket(Ticket $ticket): ?Ticket
    {
        $this->expireOldTicketsForServiceId($ticket->service_id);

        // Vérifier que le ticket est bien appelé
        if ($ticket->status !== 'called') {
            throw new \InvalidArgumentException('Ticket must be called to defer');
        }

        // Vérifier la période de grâce (24h depuis appel original ou premier appel)
        $referenceTime = $ticket->original_called_at ?? $ticket->called_at;
        if ($referenceTime && Carbon::parse($referenceTime)->addHours(24)->isPast()) {
            throw new \InvalidArgumentException('Grace period expired, cannot defer');
        }

        return DB::transaction(function () use ($ticket) {
            $service = $ticket->service;

            // Trouver le prochain ticket waiting après celui-ci
            $nextTicket = Ticket::query()
                ->where('service_id', $service->id)
                ->where('status', 'waiting')
                ->where('position', '>', $ticket->position)
                ->orderBy('position')
                ->orderBy('created_at')
                ->lockForUpdate()
                ->first();

            // Si pas de ticket suivant, on ne peut pas déférer
            if (!$nextTicket) {
                return null;
            }

            // Sauvegarder les positions originales
            $ticketOriginalPosition = $ticket->position;
            $nextTicketPosition = $nextTicket->position;

            // Le ticket déferré prend la position du suivant
            $ticket->position = $nextTicketPosition;
            $ticket->status = 'waiting';
            $ticket->deferred_at = Carbon::now();
            $ticket->deferral_count = ($ticket->deferral_count ?? 0) + 1;
            $ticket->is_swapped = true;
            $ticket->swapped_with_ticket_id = $nextTicket->id;
            if (!$ticket->original_called_at) {
                $ticket->original_called_at = $ticket->called_at;
            }
            $ticket->grace_period_expires_at = Carbon::parse($ticket->original_called_at)->addHours(24);
            $ticket->called_at = null;
            $ticket->counter_id = null;
            $ticket->save();

            // Le ticket suivant est appelé à la place
            $nextTicket->position = $ticketOriginalPosition;
            $nextTicket->status = 'called';
            $nextTicket->called_at = Carbon::now();
            $nextTicket->is_swapped = true;
            $nextTicket->swapped_with_ticket_id = $ticket->id;
            $nextTicket->save();

            // Notifications
            if ($nextTicket->user) {
                dispatch(new SendPushNotification(
                    $nextTicket->user->id,
                    "C'est votre tour !",
                    'Le ticket précédent est absent. Présentez-vous au guichet.',
                    ['ticket_id' => $nextTicket->id, 'service_id' => $service->id, 'swapped' => true]
                ));
            }

            if ($ticket->user) {
                dispatch(new SendPushNotification(
                    $ticket->user->id,
                    'Ticket différé',
                    'Vous avez été recalé en position ' . $ticket->position . '. Vous avez 24h pour vous présenter.',
                    ['ticket_id' => $ticket->id, 'service_id' => $service->id, 'deferred' => true]
                ));
            }

            // Événements
            event(new TicketUpdated($ticket->id, [
                'status' => 'waiting',
                'position' => $ticket->position,
                'is_swapped' => true,
                'deferred_at' => $ticket->deferred_at,
            ]));
            event(new TicketUpdated($nextTicket->id, [
                'status' => 'called',
                'position' => $nextTicket->position,
                'is_swapped' => true,
            ]));

            if ($ticket->user) {
                event(new UserTicketUpdated($ticket->user->id, [
                    'ticket_id' => $ticket->id,
                    'service_id' => $service->id,
                    'status' => 'waiting',
                    'position' => $ticket->position,
                    'deferred' => true,
                ]));
            }

            if ($nextTicket->user) {
                event(new UserTicketUpdated($nextTicket->user->id, [
                    'ticket_id' => $nextTicket->id,
                    'service_id' => $service->id,
                    'status' => 'called',
                    'position' => $nextTicket->position,
                    'swapped' => true,
                ]));
            }

            return $ticket->fresh();
        });
    }

    /**
     * Version améliorée de markAbsent qui tente d'abord de déférer le ticket
     * pendant la période de grâce de 24h.
     */
    public function markAbsentWithDeferral(Ticket $ticket): Ticket
    {
        $this->expireOldTicketsForServiceId($ticket->service_id);

        // Vérifier si on peut déférer (période de grâce de 24h)
        $referenceTime = $ticket->original_called_at ?? $ticket->called_at;
        $canDefer = $ticket->status === 'called' && 
                    $referenceTime && 
                    !Carbon::parse($referenceTime)->addHours(24)->isPast();

        if ($canDefer) {
            // Essayer de déférer
            $deferred = $this->deferCalledTicket($ticket);
            if ($deferred) {
                return $deferred;
            }
            // Si pas de ticket suivant, marquer absent normalement
        }

        // Fallback : marquer absent classiquement
        return $this->markAbsent($ticket);
    }

    /**
     * Annule un ticket par l'utilisateur.
     */
    public function cancel(Ticket $ticket): Ticket
    {
        $ticket->status = 'canceled';
        $ticket->save();
        event(new TicketUpdated($ticket->id, ['status' => $ticket->status]));

        if ($ticket->user) {
            event(new UserTicketUpdated($ticket->user->id, [
                'ticket_id' => $ticket->id,
                'service_id' => $ticket->service_id,
                'status' => $ticket->status,
            ]));
        }
        $this->recomputePositions($ticket->service);
        return $ticket->fresh();
    }

    /**
     * Rappelle un ticket (repasse en called si toujours éligible).
     */
    public function recall(Ticket $ticket): Ticket
    {
        $this->expireOldTicketsForServiceId($ticket->service_id);

        $ticket->status = 'called';
        $ticket->called_at = Carbon::now();
        $ticket->save();
        event(new TicketCalled($ticket->id, ['number' => $ticket->number]));
        event(new ServiceTicketCalled($ticket->service_id, [
            'ticket' => [
                'id' => $ticket->id,
                'number' => $ticket->number,
            ]
        ]));

        if ($ticket->user) {
            event(new UserTicketUpdated($ticket->user->id, [
                'ticket_id' => $ticket->id,
                'service_id' => $ticket->service_id,
                'status' => $ticket->status,
                'number' => $ticket->number,
                'counter_id' => $ticket->counter_id,
            ]));
        }
        return $ticket->fresh();
    }

    /**
     * Estimation simple de la distance (mètres) entre l'utilisateur et l'établissement du service.
     * Utilise Haversine approximatif si lat/lng fournis et si le service a des coordonnées via son établissement.
     */
    private function estimateDistanceMeters(?float $lat, ?float $lng, Service $service): ?int
    {
        $est = $service->establishment;
        if ($lat === null || $lng === null || !$est || $est->lat === null || $est->lng === null) {
            return null;
        }
        $earth = 6371000; // m
        $dLat = deg2rad($est->lat - $lat);
        $dLng = deg2rad($est->lng - $lng);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat)) * cos(deg2rad($est->lat)) * sin($dLng/2) * sin($dLng/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return (int) round($earth * $c);
    }

    private function expireOldTicketsForServiceId(int $serviceId): void
    {
        $service = Service::query()->find($serviceId);
        if (!$service) return;
        $this->expireOldTicketsForService($service);
    }

    private function expireOldTicketsForService(Service $service): void
    {
        $cutoff = Carbon::now()->subHours(24);

        $updated = Ticket::query()
            ->where('service_id', $service->id)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->where('created_at', '<', $cutoff)
            ->update([
                'status' => 'expired',
                'position' => null,
                'updated_at' => Carbon::now(),
            ]);

        if ($updated > 0) {
            $this->recomputePositions($service);
        }
    }
}
