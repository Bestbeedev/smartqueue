<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\TicketUpdateRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\TicketService;

class TicketController extends Controller
{
    /**
     * Création d'un ticket par un utilisateur authentifié.
     */
    public function store(StoreTicketRequest $request, TicketService $service)
    {
        $ticket = $service->createTicket(
            user: $request->user(),
            serviceId: (int) $request->validated('service_id'),
            lat: $request->validated('lat') ?? null,
            lng: $request->validated('lng') ?? null,
            fromQr: $request->validated('from_qr') ?? null,
        );
        return new TicketResource($ticket);
    }

    /**
     * Liste des tickets actifs de l'utilisateur (waiting/called/absent).
     */
    public function active(Request $request)
    {
        // Expire automatiquement les tickets trop anciens (24h) avant de lister.
        // On s'appuie sur la logique centralisée du TicketService, appelée sur les actions métier.
        // Ici, on force un passage léger en expirant les tickets actifs >24h via un filtre.
        Ticket::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['waiting','called','absent'])
            ->where('created_at', '<', now()->subHours(24))
            ->update(['status' => 'expired', 'position' => null]);

        $ticket = Ticket::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['waiting','called','absent'])
            ->with(['service.establishment'])
            ->orderByDesc('created_at')
            ->first();
        
        if (!$ticket) {
            return response()->json(null, 404);
        }
        
        return new TicketResource($ticket);
    }

    /**
     * Historique paginé des tickets de l'utilisateur, avec filtres.
     * Par défaut retourne tous les tickets, ou filtré par status si spécifié.
     */
    public function history(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);
        
        $query = Ticket::query()
            ->where('user_id', $request->user()->id)
            ->with(['service.establishment'])
            ->orderByDesc('created_at');

        // Status filter - can be 'active', 'completed', or specific status
        $statusFilter = $request->query('status');
        
        if ($statusFilter === 'active') {
            // Active tickets: waiting, called, created
            $query->whereIn('status', ['waiting', 'called', 'created']);
        } elseif ($statusFilter === 'completed') {
            // Completed tickets: closed, canceled, served, expired, absent
            $query->whereIn('status', ['closed', 'canceled', 'cancelled', 'served', 'expired', 'absent']);
        } elseif ($statusFilter && $statusFilter !== 'all') {
            // Specific status filter
            $query->where('status', $statusFilter);
        }
        // If status is 'all' or not specified, show all tickets
        
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->query('to'));
        }

        $paginator = $query->paginate($perPage);
        return TicketResource::collection($paginator);
    }

    /** Détail d'un ticket (policy: view). */
    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        return new TicketResource($ticket->load(['service.establishment']));
    }

    /** Mise à jour d'un ticket (action=cancel) par son propriétaire. */
    public function update(TicketUpdateRequest $request, Ticket $ticket, TicketService $service)
    {
        $this->authorize('update', $ticket);
        $action = $request->validated('action');
        if ($action === 'cancel') {
            $ticket = $service->cancel($ticket);
        }
        return new TicketResource($ticket->load(['service.establishment']));
    }
}
