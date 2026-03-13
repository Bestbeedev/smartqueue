<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Inscription d'un utilisateur (rôle par défaut: user, ou admin si establishment fourni)
     */
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();
        
        // Déterminer le rôle: admin si establishment_name est fourni, sinon user
        $role = !empty($data['establishment_name']) ? 'admin' : 'user';
        
        // Création sécurisée de l'utilisateur
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'role' => $role,
        ]);

        // Créer l'établissement si les champs sont fournis
        $establishment = null;
        if (!empty($data['establishment_name'])) {
            $establishment = \App\Models\Establishment::create([
                'name' => $data['establishment_name'],
                'address' => $data['establishment_address'] ?? null,
                'lat' => $data['establishment_lat'] ?? null,
                'lng' => $data['establishment_lng'] ?? null,
                'open_at' => $data['establishment_open_at'] ?? null,
                'close_at' => $data['establishment_close_at'] ?? null,
                'is_active' => true,
            ]);
            
            // Lier l'admin à l'établissement
            $user->establishment_id = $establishment->id;
            $user->save();
        }

        // Émission d'un token d'accès personnel (Sanctum)
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'establishment_id' => $user->establishment_id,
            ],
            'establishment' => $establishment ? [
                'id' => $establishment->id,
                'name' => $establishment->name,
                'lat' => $establishment->lat,
                'lng' => $establishment->lng,
            ] : null,
            'token' => $token,
        ], Response::HTTP_CREATED);
    }

    /**
     * Connexion par email/mot de passe et émission d'un token Sanctum
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (!$user || !Hash::check($request->validated('password'), (string) $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], Response::HTTP_UNAUTHORIZED);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Déconnexion: révocation du token courant
     */
    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out']);
    }

    /**
     * Connexion avec Google
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        // Vérifier le token Google
        $googleResponse = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->id_token,
        ]);

        if (!$googleResponse->ok()) {
            return response()->json([
                'message' => 'Invalid Google token',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $googleUser = $googleResponse->json();
        
        // Vérifier que l'email est vérifié par Google
        if (!isset($googleUser['email_verified']) || !$googleUser['email_verified']) {
            return response()->json([
                'message' => 'Google email not verified',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Chercher ou créer l'utilisateur
        $user = User::where('email', $googleUser['email'])->first();

        if (!$user) {
            // Créer un nouvel utilisateur automatiquement
            $user = User::create([
                'name' => $googleUser['name'] ?? explode('@', $googleUser['email'])[0],
                'email' => $googleUser['email'],
                'password' => Hash::make(uniqid()), // Mot de passe aléatoire
                'phone' => null,
                'role' => 'user',
                'google_id' => $googleUser['sub'] ?? null,
                'avatar' => $googleUser['picture'] ?? null,
            ]);
        } else {
            // Mettre à jour les infos Google si nécessaire
            if (empty($user->google_id)) {
                $user->update([
                    'google_id' => $googleUser['sub'] ?? null,
                    'avatar' => $googleUser['picture'] ?? null,
                ]);
            }
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Inscription avec Google (avec phone optionnel)
     */
    public function googleRegister(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
            'phone' => 'nullable|string|max:20',
        ]);

        // Vérifier le token Google
        $googleResponse = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->id_token,
        ]);

        if (!$googleResponse->ok()) {
            return response()->json([
                'message' => 'Invalid Google token',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $googleUser = $googleResponse->json();
        
        // Vérifier que l'email est vérifié par Google
        if (!isset($googleUser['email_verified']) || !$googleUser['email_verified']) {
            return response()->json([
                'message' => 'Google email not verified',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Vérifier si l'utilisateur existe déjà
        $existingUser = User::where('email', $googleUser['email'])->first();
        
        if ($existingUser) {
            // Mettre à jour le phone si fourni
            if ($request->phone && !$existingUser->phone) {
                $existingUser->update(['phone' => $request->phone]);
            }
            
            $token = $existingUser->createToken('api')->plainTextToken;
            
            return response()->json([
                'user' => [
                    'id' => $existingUser->id,
                    'name' => $existingUser->name,
                    'email' => $existingUser->email,
                    'phone' => $existingUser->phone,
                    'role' => $existingUser->role,
                ],
                'token' => $token,
            ]);
        }

        // Créer un nouvel utilisateur
        $user = User::create([
            'name' => $googleUser['name'] ?? explode('@', $googleUser['email'])[0],
            'email' => $googleUser['email'],
            'password' => Hash::make(uniqid()),
            'phone' => $request->phone,
            'role' => 'user',
            'google_id' => $googleUser['sub'] ?? null,
            'avatar' => $googleUser['picture'] ?? null,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
            'token' => $token,
        ], Response::HTTP_CREATED);
    }
}
