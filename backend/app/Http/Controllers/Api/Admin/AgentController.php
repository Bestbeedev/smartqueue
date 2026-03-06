<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Service;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    /** Liste les agents avec leurs services assignés. */
    public function index()
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $agents = User::query()
            ->where('role', 'agent')
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->with('services')
            ->orderBy('name')
            ->paginate(50);
        return response()->json($agents);
    }

    /** Crée un agent et assigne des services. */
    public function store(Request $request)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $data = $request->validate([
            'name' => ['required','string','max:120'],
            'email' => ['required','email','unique:users,email'],
            'password' => ['nullable','string','min:8'],
            'phone' => ['nullable','string','max:32','unique:users,phone'],
            'status' => ['sometimes','string','in:active,inactive,pending'],
            'service_ids' => ['array'],
            'service_ids.*' => ['integer','exists:services,id'],
        ]);

        $temporaryPassword = null;
        if (empty($data['password'])) {
            $temporaryPassword = Str::password(12);
            $data['password'] = $temporaryPassword;
        }

        $agent = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'phone' => $data['phone'] ?? null,
            'role' => 'agent',
            'establishment_id' => $scopedId,
            'status' => $data['status'] ?? 'active',
        ]);

        if (!empty($data['service_ids'])) {
            if ($scopedId) {
                $count = Service::query()
                    ->whereIn('id', $data['service_ids'])
                    ->where('establishment_id', (int) $scopedId)
                    ->count();
                if ($count !== count($data['service_ids'])) {
                    abort(403, 'Forbidden establishment scope');
                }
            }
            $agent->services()->sync($data['service_ids']);
        }

        $payload = $agent->load('services')->toArray();
        if (!is_null($temporaryPassword)) {
            $payload['temporary_password'] = $temporaryPassword;
        }
        return response()->json($payload);
    }

    /** Affiche un agent. */
    public function show(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $agent = User::where('role', 'agent')
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->with('services')
            ->findOrFail($id);
        return response()->json($agent);
    }

    /** Met à jour un agent (données et affectations). */
    public function update(Request $request, int $id)
    {
        $scopedId = $request->attributes->get('scoped_establishment_id');
        $agent = User::where('role', 'agent')
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes','string','max:120'],
            'email' => ['sometimes','email','unique:users,email,'.$agent->id],
            'password' => ['sometimes','string','min:8'],
            'phone' => ['sometimes','nullable','string','max:32','unique:users,phone,'.$agent->id],
            'status' => ['sometimes','string','in:active,inactive,pending'],
            'service_ids' => ['sometimes','array'],
            'service_ids.*' => ['integer','exists:services,id'],
        ]);
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }
        $agent->update($data);
        if (array_key_exists('service_ids', $data)) {
            if ($scopedId && !empty($data['service_ids'])) {
                $count = Service::query()
                    ->whereIn('id', $data['service_ids'])
                    ->where('establishment_id', (int) $scopedId)
                    ->count();
                if ($count !== count($data['service_ids'])) {
                    abort(403, 'Forbidden establishment scope');
                }
            }
            $agent->services()->sync($data['service_ids'] ?? []);
        }
        return response()->json($agent->load('services'));
    }

    /** Supprime un agent. */
    public function destroy(int $id)
    {
        $scopedId = request()->attributes->get('scoped_establishment_id');
        $agent = User::where('role', 'agent')
            ->when($scopedId, fn ($q) => $q->where('establishment_id', (int) $scopedId))
            ->findOrFail($id);
        $agent->services()->detach();
        $agent->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
