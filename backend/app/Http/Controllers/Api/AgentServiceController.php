<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Service;

class AgentServiceController extends Controller
{
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
