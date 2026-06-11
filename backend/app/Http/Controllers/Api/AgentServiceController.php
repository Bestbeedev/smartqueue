<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use App\Models\Service;

class AgentServiceController extends Controller
{
    use AuthorizesRequests;

    /**
     * Ouvre un service (autorise la création de nouveaux tickets).
     */
    public function open(Service $service)
    {
        $this->authorize('manage', $service);

        $service->status = 'open';
        $service->save();

        return response()->json(['message' => 'Service opened', 'service_id' => $service->id]);
    }

    /**
     * Met à jour le délai de priorité (call_timeout_minutes) d'un service.
     */
    public function updateCallTimeout(Request $request, Service $service)
    {
        $this->authorize('manage', $service);

        $data = $request->validate([
            'call_timeout_minutes' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        $service->call_timeout_minutes = $data['call_timeout_minutes'] ?? null;
        $service->save();

        return response()->json([
            'message' => 'Délai de priorité mis à jour',
            'service_id' => $service->id,
            'call_timeout_minutes' => $service->call_timeout_minutes,
        ]);
    }

    /**
     * Ferme un service (empêche la création de nouveaux tickets).
     */
    public function close(Service $service)
    {
        // Vérifie que l'utilisateur agit en tant qu'agent/admin
        $this->authorize('manage', $service);

        $service->status = 'closed';
        $service->save();

        return response()->json(['message' => 'Service closed', 'service_id' => $service->id]);
    }
}
