<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EstablishmentResource;
use App\Models\Establishment;
use App\Models\Subscription;
use Illuminate\Http\Request;

class EstablishmentController extends Controller
{
    /** Liste des établissements (admin). */
    public function index()
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $items = Establishment::query()
            ->when($scopedId, fn ($q) => $q->where('id', (int) $scopedId))
            ->orderByDesc('created_at')
            ->paginate(50);
        return EstablishmentResource::collection($items);
    }

    /** Création d'un établissement. */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }
        if ($user->role !== 'admin') {
            abort(403, 'Forbidden');
        }

        // If admin already has an establishment scope, do not allow creating another one
        if (!empty($user->establishment_id)) {
            abort(403, 'Admin already has an establishment');
        }

        $data = $request->validate([
            'name' => ['required','string','max:160'],
            'address' => ['nullable','string'],
            'lat' => ['nullable','numeric','between:-90,90'],
            'lng' => ['nullable','numeric','between:-180,180'],
            'open_at' => ['nullable'],
            'close_at' => ['nullable'],
            'is_active' => ['boolean'],
        ]);
        $est = Establishment::create($data);

        $user->establishment_id = $est->id;
        $user->save();

        // Materialize subscription after establishment exists
        if (is_array($user->pending_subscription) && !empty($user->pending_subscription)) {
            $plan = (string) ($user->pending_subscription['plan'] ?? 'free');
            $status = (string) ($user->pending_subscription['status'] ?? 'active');

            $sub = Subscription::query()->firstOrNew([
                'establishment_id' => (int) $est->id,
            ]);
            $sub->fill([
                'plan' => $plan,
                'status' => in_array($status, ['trial','active','past_due','canceled'], true) ? $status : 'active',
                'current_period_start' => now(),
                'current_period_end' => now()->addMonth(),
                'canceled_at' => null,
                'meta' => $user->pending_subscription,
            ]);
            $sub->save();

            $user->forceFill(['pending_subscription' => null])->save();
        }

        $request->attributes->set('scoped_establishment_id', (int) $est->id);
        return new EstablishmentResource($est);
    }

    /** Détail. */
    public function show(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $est = Establishment::query()
            ->when($scopedId, fn ($q) => $q->where('id', (int) $scopedId))
            ->findOrFail($id);
        return new EstablishmentResource($est);
    }

    /** Mise à jour. */
    public function update(Request $request, int $id)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $est = Establishment::query()
            ->when($scopedId, fn ($q) => $q->where('id', (int) $scopedId))
            ->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes','string','max:160'],
            'address' => ['sometimes','nullable','string'],
            'lat' => ['sometimes','nullable','numeric','between:-90,90'],
            'lng' => ['sometimes','nullable','numeric','between:-180,180'],
            'latitude' => ['sometimes','nullable','numeric','between:-90,90'],
            'longitude' => ['sometimes','nullable','numeric','between:-180,180'],
            'open_at' => ['sometimes','nullable'],
            'close_at' => ['sometimes','nullable'],
            'is_active' => ['sometimes','boolean'],
        ]);

        if (array_key_exists('latitude', $data) && !array_key_exists('lat', $data)) {
            $data['lat'] = $data['latitude'];
        }
        if (array_key_exists('longitude', $data) && !array_key_exists('lng', $data)) {
            $data['lng'] = $data['longitude'];
        }

        unset($data['latitude'], $data['longitude']);

        $est->update($data);
        return new EstablishmentResource($est);
    }

    /** Suppression. */
    public function destroy(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $est = Establishment::query()
            ->when($scopedId, fn ($q) => $q->where('id', (int) $scopedId))
            ->findOrFail($id);
        $est->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
