<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AgentTicketActionController extends Controller
{
    use AuthorizesRequests;
    public function close(Ticket $ticket, TicketService $svc)
    {
        $this->authorize('actOn', $ticket);

        $ticket = $svc->close($ticket);

        return response()->json(['ticket' => [
            'id' => $ticket->id,
            'status' => $ticket->status,
        ]]);
    }

    public function cancel(Ticket $ticket, TicketService $svc)
    {
        $this->authorize('actOn', $ticket);

        $ticket = $svc->cancel($ticket);

        return response()->json(['ticket' => [
            'id' => $ticket->id,
            'status' => $ticket->status,
        ]]);
    }

    /**
     * Marque un ticket comme absent avec tentative de déférer automatiquement.
     * Système deux chances : 1re absence = récupérable, 2e absence = définitif + expiration programmée.
     */
    public function markAbsent(Request $request, Ticket $ticket, TicketService $svc)
    {
        $this->authorize('actOn', $ticket);

        $ticket       = $svc->markAbsent($ticket);
        $absenceLevel = $ticket->deferral_count ?? 1;
        $recallPossible = $absenceLevel < 2;

        return response()->json([
            'ticket' => [
                'id'             => $ticket->id,
                'status'         => $ticket->status,
                'deferral_count' => $absenceLevel,
                'recall_possible'=> $recallPossible,
                'called_expires_at' => $absenceLevel >= 2
                    ? optional($ticket->called_expires_at)->toIso8601String()
                    : null,
            ],
            'absent_level'   => $absenceLevel,
            'recall_possible'=> $recallPossible,
            'message'        => $recallPossible
                ? 'Ticket marqué absent — rappel possible.'
                : 'Ticket absent définitivement — expiration automatique programmée.',
        ]);
    }

    /**
     * Défère explicitement un ticket appelé.
     * Échange sa position avec le ticket suivant dans la file.
     */
    public function defer(Request $request, Ticket $ticket, TicketService $svc)
    {
        $this->authorize('actOn', $ticket);

        try {
            $deferredTicket = $svc->deferCalledTicket($ticket);

            if (!$deferredTicket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun ticket suivant disponible pour l\'échange',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'ticket' => [
                    'id' => $deferredTicket->id,
                    'status' => $deferredTicket->status,
                    'position' => $deferredTicket->position,
                    'is_swapped' => $deferredTicket->is_swapped,
                    'deferred_at' => $deferredTicket->deferred_at,
                    'grace_period_expires_at' => $deferredTicket->grace_period_expires_at,
                ],
                'message' => 'Ticket différé avec succès. Position échangée avec le suivant.',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function setPriority(Request $request, Ticket $ticket, TicketService $svc)
    {
        $this->authorize('actOn', $ticket);

        $data = $request->validate([
            'priority' => ['required','in:normal,high,vip'],
        ]);

        $ticket = $svc->setPriority($ticket, $data['priority']);

        return response()->json(['ticket' => [
            'id' => $ticket->id,
            'priority' => $ticket->priority,
        ]]);
    }
}