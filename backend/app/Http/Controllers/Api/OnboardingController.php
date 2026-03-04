<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OnboardingRegisterEstablishmentRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class OnboardingController extends Controller
{
    /**
     * Inscription d'un établissement (SaaS) + création du compte admin scoppé.
     * Retourne un token Sanctum et indique que l'étape suivante est l'abonnement.
     */
    public function registerEstablishment(OnboardingRegisterEstablishmentRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => Hash::make($data['admin_password']),
                'phone' => $data['admin_phone'] ?? null,
                'role' => 'admin',
                'establishment_id' => null,
            ]);

            $token = $admin->createToken('api')->plainTextToken;

            return response()->json([
                'user' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                    'role' => $admin->role,
                    'establishment_id' => $admin->establishment_id,
                ],
                'token' => $token,
                'next_step' => 'subscription',
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Mock paiement: active l'abonnement de l'établissement de l'admin connecté.
     */
    public function subscribe(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }
        if ($user->role !== 'admin') {
            abort(403, 'Forbidden');
        }

        $data = $request->validate([
            'plan' => ['required','string','max:32'],
            'paid' => ['required','boolean'],
        ]);

        if (!$data['paid']) {
            abort(422, 'Payment required');
        }

        $user->forceFill([
            'pending_subscription' => [
                'status' => 'active',
                'plan' => $data['plan'],
                'paid_at' => now()->toISOString(),
                'source' => 'onboarding',
            ],
        ])->save();

        return response()->json([
            'pending_subscription' => $user->pending_subscription,
            'next_step' => 'create_establishment',
        ]);
    }

    /**
     * Retourne l'utilisateur courant et son scope (utile pour le front).
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $services = null;
        $counters = null;
        if (in_array($user->role, ['agent', 'admin'], true)) {
            $services = $user->services()
                ->select(['services.id', 'services.name', 'services.status', 'services.avg_service_time_minutes', 'services.priority_support', 'services.capacity'])
                ->orderBy('services.name')
                ->get();

            if (!empty($user->establishment_id)) {
                $counters = \App\Models\Counter::query()
                    ->where('establishment_id', $user->establishment_id)
                    ->select(['id', 'name', 'status', 'current_agent_id'])
                    ->orderBy('name')
                    ->get();
            }
        }
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'establishment_id' => $user->establishment_id,
            'pending_subscription' => $user->pending_subscription,
            'services' => $services,
            'counters' => $counters,
        ]);
    }
}
