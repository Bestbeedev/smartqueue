<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\AlertService;
use App\Events\UserEnRoute;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TicketRecallController extends Controller
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * User requests a recall (seconde chance).
     * Sends push + SMS, resets countdown once.
     */
    public function recall(Request $request, Ticket $ticket): JsonResponse
    {
        // Authorize: only ticket owner can recall
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Can only recall if ticket is called
        if ($ticket->status !== 'called') {
            return response()->json([
                'error' => 'Le ticket n\'est pas en statut appelé',
            ], 400);
        }

        // Can only recall once
        if ($ticket->has_recalled) {
            return response()->json([
                'error' => 'Le rappel a déjà été utilisé',
            ], 400);
        }

        // Mark as recalled and reset called_at for new countdown
        $ticket->update([
            'has_recalled' => true,
            'called_at' => now(), // Reset countdown
        ]);

        // Send push + SMS notification
        $this->alertService->sendRecallNotification($ticket);

        return response()->json([
            'data' => $ticket->fresh(),
            'message' => 'Rappel envoyé',
            'countdown_seconds' => config('queue.call_timeout_seconds', 180),
        ]);
    }

    /**
     * User confirms they are on their way.
     * Notifies agent with estimated travel time.
     */
    public function enRoute(Request $request, Ticket $ticket): JsonResponse
    {
        // Authorize: only ticket owner
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Can only confirm if ticket is called
        if ($ticket->status !== 'called') {
            return response()->json([
                'error' => 'Le ticket n\'est pas en statut appelé',
            ], 400);
        }

        $validated = $request->validate([
            'estimated_travel_minutes' => 'sometimes|integer|min:1|max:60',
            'lat' => 'sometimes|numeric',
            'lng' => 'sometimes|numeric',
        ]);

        // Calculate travel time if coordinates provided
        $travelMinutes = $validated['estimated_travel_minutes'] ?? null;
        
        if (isset($validated['lat'], $validated['lng'])) {
            $travelMinutes = $this->alertService->calculateTravelTime(
                $validated['lat'],
                $validated['lng'],
                $ticket->service->establishment->lat,
                $ticket->service->establishment->lng,
                $request->user()->alertPreference?->preferred_transport_mode ?? 'motorcycle'
            );
            
            // Update user's last known location
            $ticket->update([
                'last_lat' => $validated['lat'],
                'last_lng' => $validated['lng'],
            ]);
        }

        // Mark as en route
        $ticket->update([
            'en_route_at' => now(),
            'estimated_travel_minutes' => $travelMinutes,
        ]);

        // Broadcast to agent dashboard via service channel
        \Log::info('UserEnRoute event dispatching', [
            'ticket_id' => $ticket->id,
            'service_id' => $ticket->service_id,
            'ticket_number' => $ticket->number,
            'estimated_minutes' => $travelMinutes,
        ]);
        
        event(new UserEnRoute(
            $ticket->id,
            $ticket->service_id,
            $travelMinutes,
            $ticket->number
        ));

        return response()->json([
            'data' => $ticket->fresh(),
            'message' => 'En route confirmé',
            'estimated_travel_minutes' => $travelMinutes,
        ]);
    }

    /**
     * Get countdown status for a called ticket.
     */
    public function countdown(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($ticket->status !== 'called') {
            return response()->json([
                'is_called' => false,
                'countdown_seconds' => 0,
            ]);
        }

        $timeoutSeconds = config('queue.call_timeout_seconds', 180);
        $calledAt = $ticket->called_at ?? now();
        $elapsed = now()->diffInSeconds($calledAt);
        $remaining = max(0, $timeoutSeconds - $elapsed);

        return response()->json([
            'is_called' => true,
            'countdown_seconds' => $remaining,
            'has_recalled' => $ticket->has_recalled,
            'counter_number' => $ticket->counter?->number,
            'is_en_route' => !is_null($ticket->en_route_at),
        ]);
    }
}
