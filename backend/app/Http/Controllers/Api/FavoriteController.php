<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Establishment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favorites = $request->user()
            ->favoriteEstablishments()
            ->get();

        return response()->json($favorites);
    }

    public function store(Request $request, Establishment $establishment): JsonResponse
    {
        $user = $request->user();

        if ($user->favoriteEstablishments()->where('establishment_id', $establishment->id)->exists()) {
            return response()->json(['message' => 'Déjà dans vos favoris'], 200);
        }

        $user->favoriteEstablishments()->attach($establishment->id);

        return response()->json(['message' => 'Ajouté aux favoris'], 201);
    }

    public function destroy(Request $request, Establishment $establishment): JsonResponse
    {
        $request->user()->favoriteEstablishments()->detach($establishment->id);

        return response()->json(['message' => 'Retiré des favoris'], 200);
    }

    public function status(Request $request, Establishment $establishment): JsonResponse
    {
        $isFavorited = $request->user()
            ->favoriteEstablishments()
            ->where('establishment_id', $establishment->id)
            ->exists();

        return response()->json(['is_favorited' => $isFavorited]);
    }
}
