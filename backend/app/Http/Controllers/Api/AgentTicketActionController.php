<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\Request;

class AgentTicketActionController extends Controller
{
    public function close(Ticket $ticket, TicketService $svc)
    {
        $this->authorize('actOn', $ticket);

        $ticket->status = 'closed';
        $ticket->closed_at = now();
        $ticket->save();

        $svc->recomputePositions($ticket->service);

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

    public function setPriority(Request $request, Ticket $ticket, TicketService $svc)
    {
        $this->authorize('actOn', $ticket);

        $data = $request->validate([
            'priority' => ['required','in:normal,high,vip'],
        ]);

        $ticket->priority = $data['priority'];
        $ticket->save();

        $svc->recomputePositions($ticket->service);

        return response()->json(['ticket' => [
            'id' => $ticket->id,
            'priority' => $ticket->priority,
        ]]);
    }
}
