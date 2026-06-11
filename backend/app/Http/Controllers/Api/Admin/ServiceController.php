<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Service;
use App\Http\Resources\ServiceResource;
use App\Services\ServiceAvailabilityService;

class ServiceController extends Controller
{
    /** Liste des services. */
    public function index()
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $items = Service::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->with('establishment')
            ->orderByDesc('created_at')
            ->paginate(50);
        return ServiceResource::collection($items);
    }

    /** Création d'un service. */
    public function store(Request $request)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $data = $request->validate([
            'establishment_id' => ['required','integer','exists:establishments,id'],
            'name' => ['required','string','max:160'],
            'avg_service_time_minutes' => ['nullable','integer','min:1','max:240'],
            'status' => ['nullable','in:open,closed'],
            'priority_support' => ['nullable','boolean'],
            'priority_mode' => ['nullable','in:immediate,weighted,disabled'],
            'priority_weighted_ratio' => ['nullable','integer','min:1','max:50'],
            'call_timeout_minutes' => ['nullable','integer','min:1','max:60'],
            'capacity' => ['nullable','integer','min:1','max:5000'],
        ]);

        if ($scopedId && (int) $data['establishment_id'] !== (int) $scopedId) {
            abort(403, 'Forbidden establishment scope');
        }
        $service = Service::create($data);
        // Seed working days (Mon-Fri open, Sat-Sun closed) so the schedule is immediately editable
        app(ServiceAvailabilityService::class)->ensureWorkingDaysExist($service);
        return new ServiceResource($service->load('establishment'));
    }

    /** Détail d'un service. */
    public function show(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $service = Service::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->with('establishment')
            ->findOrFail($id);
        return new ServiceResource($service);
    }

    /** Mise à jour d'un service. */
    public function update(Request $request, int $id)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $service = Service::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->findOrFail($id);
        $data = $request->validate([
            'establishment_id' => ['sometimes','integer','exists:establishments,id'],
            'name' => ['sometimes','string','max:160'],
            'avg_service_time_minutes' => ['sometimes','integer','min:1','max:240'],
            'status' => ['sometimes','in:open,closed'],
            'priority_support' => ['sometimes','boolean'],
            'priority_mode' => ['sometimes','in:immediate,weighted,disabled'],
            'priority_weighted_ratio' => ['sometimes','integer','min:1','max:50'],
            'call_timeout_minutes' => ['sometimes','nullable','integer','min:1','max:60'],
            'capacity' => ['sometimes','nullable','integer','min:1','max:5000'],
        ]);

        if ($scopedId && isset($data['establishment_id']) && (int) $data['establishment_id'] !== (int) $scopedId) {
            abort(403, 'Forbidden establishment scope');
        }
        $service->update($data);
        return new ServiceResource($service->load('establishment'));
    }

    /** Suppression. */
    public function destroy(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $service = Service::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->findOrFail($id);
        $service->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
