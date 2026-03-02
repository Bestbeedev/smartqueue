<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use Illuminate\Http\Request;

class CounterController extends Controller
{
    public function index(Request $request)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $items = Counter::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->with(['establishment','currentAgent'])
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $data = $request->validate([
            'establishment_id' => ['required','integer','exists:establishments,id'],
            'name' => ['required','string','max:120'],
        ]);

        if ($scopedId && (int) $data['establishment_id'] !== (int) $scopedId) {
            abort(403, 'Forbidden establishment scope');
        }

        $counter = Counter::create([
            'establishment_id' => $data['establishment_id'],
            'name' => $data['name'],
            'status' => 'closed',
        ]);

        return response()->json($counter->load(['establishment','currentAgent']));
    }

    public function show(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $counter = Counter::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->with(['establishment','currentAgent'])
            ->findOrFail($id);
        return response()->json($counter);
    }

    public function update(Request $request, int $id)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $counter = Counter::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->findOrFail($id);
        $data = $request->validate([
            'establishment_id' => ['sometimes','integer','exists:establishments,id'],
            'name' => ['sometimes','string','max:120'],
            'status' => ['sometimes','in:open,closed'],
        ]);

        if ($scopedId && isset($data['establishment_id']) && (int) $data['establishment_id'] !== (int) $scopedId) {
            abort(403, 'Forbidden establishment scope');
        }

        $counter->update($data);
        return response()->json($counter->load(['establishment','currentAgent']));
    }

    public function destroy(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $counter = Counter::query()
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->findOrFail($id);
        $counter->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
