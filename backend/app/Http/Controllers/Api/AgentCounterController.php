<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use Illuminate\Http\Request;

class AgentCounterController extends Controller
{
    public function open(Counter $counter, Request $request)
    {
        if (!in_array($request->user()->role, ['agent','admin'], true)) {
            abort(403, 'Forbidden');
        }

        $counter->status = 'open';
        $counter->opened_at = now();
        $counter->closed_at = null;
        $counter->current_agent_id = $request->user()->id;
        $counter->save();

        return response()->json(['counter' => [
            'id' => $counter->id,
            'status' => $counter->status,
            'current_agent_id' => $counter->current_agent_id,
        ]]);
    }

    public function close(Counter $counter, Request $request)
    {
        if (!in_array($request->user()->role, ['agent','admin'], true)) {
            abort(403, 'Forbidden');
        }

        if ($request->user()->role === 'agent' && $counter->current_agent_id !== $request->user()->id) {
            abort(403, 'You are not assigned to this counter');
        }

        $counter->status = 'closed';
        $counter->closed_at = now();
        $counter->current_agent_id = null;
        $counter->save();

        return response()->json(['counter' => [
            'id' => $counter->id,
            'status' => $counter->status,
        ]]);
    }
}
