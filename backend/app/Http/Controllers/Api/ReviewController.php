<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Ticket;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Soumettre une évaluation pour un ticket terminé.
     * POST /api/tickets/{ticket}/review
     */
    public function store(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        // Seul le propriétaire du ticket peut l'évaluer (si le ticket a un user_id)
        if ($ticket->user_id && $ticket->user_id !== $user->id) {
            abort(403, 'Accès refusé.');
        }

        // Le ticket doit être terminé
        if (!in_array($ticket->status, ['closed', 'served', 'absent'])) {
            return response()->json([
                'error' => 'Le ticket doit être terminé pour être évalué.',
            ], 422);
        }

        // Un seul avis par ticket
        if ($ticket->review()->exists()) {
            return response()->json([
                'error' => 'Ce ticket a déjà été évalué.',
            ], 409);
        }

        $validated = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $review = Review::create([
            'ticket_id'  => $ticket->id,
            'service_id' => $ticket->service_id,
            'user_id'    => $user->id,
            'rating'     => $validated['rating'],
            'comment'    => $validated['comment'] ?? null,
        ]);

        return response()->json(['success' => true, 'review' => $review]);
    }
}
