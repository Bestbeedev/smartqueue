<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Carbon;

class AgentQueueController extends Controller
{
    use AuthorizesRequests;

    /**
     * Vue complète temps réel de la file du jour (waiting/called/en_route/present/absent).
     */
    public function index(Service $service, Request $request)
    {
        $this->authorize('manage', $service);

        $query = Ticket::query()
            ->where('service_id', $service->id)
            ->whereIn('status', ['waiting','called','en_route','present','absent'])
            ->where(function ($q) {
                $q->whereNull('absent_expires_at')
                  ->orWhere('status', '!=', 'absent');
            })
            ->whereDate('valid_date', Carbon::today());

        // Filtre par statut
        if ($request->filled('status')) {
            $statuses = explode(',', $request->input('status'));
            $query->whereIn('status', $statuses);
        }

        // Filtre par priorité
        if ($request->filled('priority')) {
            $priorities = explode(',', $request->input('priority'));
            $query->whereIn('priority', $priorities);
        }

        // Recherche textuelle (numéro, nom client, téléphone)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $items = $query
            ->orderByRaw("CASE status WHEN 'present' THEN 1 WHEN 'called' THEN 2 WHEN 'en_route' THEN 3 WHEN 'waiting' THEN 4 ELSE 5 END")
            ->orderByRaw("CASE priority WHEN 'urgence' THEN 4 WHEN 'vip' THEN 3 WHEN 'high' THEN 2 ELSE 1 END DESC")
            ->orderBy('position')
            ->orderBy('created_at')
            ->with(['user','counter'])
            ->get();

        return response()->json([
            'service_id' => $service->id,
            'tickets' => $items->map(function (Ticket $t) {
                $displayName = $t->customer_name ?? $t->user?->name ?? null;
                return [
                    'id'                      => $t->id,
                    'number'                  => $t->number,
                    'status'                  => $t->status,
                    'priority'                => $t->priority,
                    'priority_reason'         => $t->priority_reason,
                    'source'                  => $t->source ?? 'app',
                    'display_name'            => $displayName,
                    'customer_name'           => $t->customer_name,
                    'customer_phone'          => $t->customer_phone,
                    'is_senior'               => (bool) $t->is_senior,
                    'is_handicap'             => (bool) $t->is_handicap,
                    'is_pregnant'             => (bool) $t->is_pregnant,
                    'position'                => $t->position,
                    'eta_minutes'             => $t->eta_minutes,
                    'is_swapped'              => (bool) $t->is_swapped,
                    'absent_level'            => (int) ($t->absent_level ?? 0),
                    'absent_expires_at'       => optional($t->absent_expires_at)->toIso8601String(),
                    'max_call_attempts'       => (int) ($t->service?->max_call_attempts ?? 2),
                    'deferral_count'          => (int) ($t->deferral_count ?? 0),
                    'deferred_at'             => optional($t->deferred_at)->toDateTimeString(),
                    'swapped_with_ticket_id'  => $t->swapped_with_ticket_id,
                    'created_at'              => $t->created_at->toDateTimeString(),
                    'called_at'               => optional($t->called_at)->toDateTimeString(),
                    'absent_at'               => optional($t->absent_at)->toDateTimeString(),
                    'en_route_at'             => optional($t->en_route_at)->toDateTimeString(),
                    'present_at'              => optional($t->present_at)->toDateTimeString(),
                    'response_received_at'    => optional($t->response_received_at)->toDateTimeString(),
                    'en_route_expires_at'     => optional($t->en_route_expires_at)->toIso8601String(),
                    'called_expires_at'       => optional($t->called_expires_at)->toIso8601String(),
                    'estimated_travel_minutes'=> $t->estimated_travel_minutes,
                    'last_distance_m'         => $t->last_distance_m,
                    'auto_deferred'           => (bool) $t->auto_deferred,
                    'defer_reason'            => $t->defer_reason,
                    'valid_date'              => $t->valid_date?->toDateString(),
                    'user' => $t->user ? [
                        'id'    => $t->user->id,
                        'name'  => $t->user->name,
                        'phone' => $t->user->phone,
                    ] : null,
                    'counter' => $t->counter ? [
                        'id'   => $t->counter->id,
                        'name' => $t->counter->name,
                    ] : null,
                ];
            }),
        ]);
    }

    /**
     * Tickets reportés aux jours suivants pour ce service (vue agent).
     * Retourne les tickets groupés par date de planification.
     */
    public function deferredQueue(Service $service): \Illuminate\Http\JsonResponse
    {
        $this->authorize('manage', $service);

        $tickets = Ticket::query()
            ->where('service_id', $service->id)
            ->where('auto_deferred', true)
            ->where('status', 'waiting')
            ->whereDate('valid_date', '>', Carbon::today())
            ->orderBy('valid_date')
            ->orderBy('position')
            ->orderBy('created_at')
            ->with(['user'])
            ->get();

        $byDate = $tickets->groupBy(fn ($t) => $t->valid_date?->toDateString())
            ->map(fn ($group, $date) => [
                'date'    => $date,
                'count'   => $group->count(),
                'tickets' => $group->map(fn (Ticket $t) => [
                    'id'             => $t->id,
                    'number'         => $t->number,
                    'status'         => $t->status,
                    'priority'       => $t->priority,
                    'priority_reason'=> $t->priority_reason,
                    'source'         => $t->source ?? 'app',
                    'display_name'   => $t->customer_name ?? $t->user?->name ?? null,
                    'customer_name'  => $t->customer_name,
                    'customer_phone' => $t->customer_phone,
                    'is_senior'      => (bool) $t->is_senior,
                    'is_handicap'    => (bool) $t->is_handicap,
                    'is_pregnant'    => (bool) $t->is_pregnant,
                    'position'       => $t->position,
                    'auto_deferred'  => true,
                    'defer_reason'   => $t->defer_reason,
                    'valid_date'     => $t->valid_date?->toDateString(),
                    'created_at'     => $t->created_at->toDateTimeString(),
                    'user' => $t->user ? ['id' => $t->user->id, 'name' => $t->user->name] : null,
                ])->values(),
            ])
            ->values();

        return response()->json([
            'service_id' => $service->id,
            'total'      => $tickets->count(),
            'days'       => $byDate,
        ]);
    }
}
