<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAlertPreference;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AlertPreferenceController extends Controller
{
    /**
     * Get the authenticated user's alert preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $preferences = UserAlertPreference::getForUser($request->user()->id);
        
        return response()->json([
            'data' => $preferences,
        ]);
    }

    /**
     * Update the authenticated user's alert preferences.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channels' => ['sometimes', 'array'],
            'channels.*' => ['in:push,sms'],
            'marginMinutes' => ['sometimes', 'integer', 'min:1', 'max:60'],
            'marginOption' => ['sometimes'],
            'enableSafetyAlert' => ['sometimes', 'boolean'],
            'phoneNumber' => ['sometimes', 'nullable', 'string', 'max:20'],
            'preferredTransportMode' => ['sometimes', 'in:walking,motorcycle,car'],
        ]);

        $preferences = UserAlertPreference::getForUser($request->user()->id);

        // Map frontend camelCase to backend snake_case
        $updateData = [];
        
        if (isset($validated['channels'])) {
            $updateData['channels'] = $validated['channels'];
        }
        if (isset($validated['marginMinutes'])) {
            $updateData['margin_minutes'] = $validated['marginMinutes'];
        }
        if (isset($validated['marginOption'])) {
            $updateData['margin_option'] = (string) $validated['marginOption'];
        }
        if (isset($validated['enableSafetyAlert'])) {
            $updateData['enable_safety_alert'] = $validated['enableSafetyAlert'];
        }
        if (array_key_exists('phoneNumber', $validated)) {
            $updateData['phone_number'] = $validated['phoneNumber'];
        }
        if (isset($validated['preferredTransportMode'])) {
            $updateData['preferred_transport_mode'] = $validated['preferredTransportMode'];
        }

        $preferences->update($updateData);

        return response()->json([
            'data' => $preferences->fresh(),
            'message' => 'Préférences mises à jour',
        ]);
    }

    /**
     * Reset preferences to defaults.
     */
    public function reset(Request $request): JsonResponse
    {
        $preferences = UserAlertPreference::getForUser($request->user()->id);
        $preferences->update(UserAlertPreference::getDefaults());

        return response()->json([
            'data' => $preferences->fresh(),
            'message' => 'Préférences réinitialisées',
        ]);
    }
}
