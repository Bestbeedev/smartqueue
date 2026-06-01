<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketLocationController extends Controller
{
    public function __construct(private AlertService $alertService) {}

    /**
     * POST /api/tickets/{ticket}/location
     *
     * The mobile app reports the user's current position (throttled) while the
     * ticket is still active. The server stores it and derives an estimated
     * travel time so the reminder engine can fire a "leave now" (LEAVE) reminder
     * even when the app is later backgrounded or closed.
     */
    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (! in_array($ticket->status, ['waiting', 'called'], true)) {
            return response()->json(['error' => 'Le ticket n\'est pas actif'], 400);
        }

        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $establishment = $ticket->service?->establishment;
        $travelMinutes = $ticket->estimated_travel_minutes;

        if ($establishment && $establishment->lat !== null && $establishment->lng !== null) {
            $mode = $request->user()->alertPreference?->preferred_transport_mode ?? 'motorcycle';
            $travelMinutes = $this->alertService->calculateTravelTime(
                (float) $validated['lat'],
                (float) $validated['lng'],
                (float) $establishment->lat,
                (float) $establishment->lng,
                $mode
            );
        }

        $ticket->update([
            'last_lat' => $validated['lat'],
            'last_lng' => $validated['lng'],
            'last_seen_at' => now(),
            'estimated_travel_minutes' => $travelMinutes,
        ]);

        return response()->json([
            'data' => [
                'ticket_id' => $ticket->id,
                'estimated_travel_minutes' => $travelMinutes,
            ],
        ]);
    }
}
