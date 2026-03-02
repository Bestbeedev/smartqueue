<?php

namespace App\Http\Controllers\Api\Saas;

use App\Http\Controllers\Controller;
use App\Models\Establishment;
use Illuminate\Http\Request;

class EstablishmentController extends Controller
{
    public function index(Request $request)
    {
        $items = Establishment::query()
            ->with(['subscription'])
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($items);
    }

    public function store(Request $request)
    {
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

        return response()->json($est->load('subscription'));
    }

    public function show(int $id)
    {
        $est = Establishment::with('subscription')->findOrFail($id);
        return response()->json($est);
    }

    public function update(Request $request, int $id)
    {
        $est = Establishment::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes','string','max:160'],
            'address' => ['sometimes','nullable','string'],
            'lat' => ['sometimes','nullable','numeric','between:-90,90'],
            'lng' => ['sometimes','nullable','numeric','between:-180,180'],
            'open_at' => ['sometimes','nullable'],
            'close_at' => ['sometimes','nullable'],
            'is_active' => ['sometimes','boolean'],
        ]);
        $est->update($data);
        return response()->json($est->load('subscription'));
    }

    public function destroy(int $id)
    {
        $est = Establishment::findOrFail($id);
        $est->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
