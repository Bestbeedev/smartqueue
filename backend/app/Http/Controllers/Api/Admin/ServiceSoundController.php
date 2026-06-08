<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Admin: 1 manage per-service sound alert configuration.
 *
 * sound_settings shape stored in services.sound_settings (jsonb):
 * {
 *   "enabled": true,
 *   "sound_uri": null,          // null = bundled default, string = custom URL
 *   "repeat_interval_seconds": 30,
 *   "volume": 1.0,
 *   "push_channel_id": "smartqueue-calls"
 * }
 */
class ServiceSoundController extends Controller
{
    private const DEFAULTS = [
        'enabled'                  => true,
        'sound_uri'                => null,
        'repeat_interval_seconds'  => 30,
        'volume'                   => 1.0,
        'push_channel_id'          => 'smartqueue-calls',
    ];

    public function show(Service $service): JsonResponse
    {
        return response()->json([
            'data' => $this->resolved($service),
        ]);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $request->validate([
            'enabled'                 => 'sometimes|boolean',
            'sound_uri'               => 'sometimes|nullable|string|max:512',
            'repeat_interval_seconds' => 'sometimes|integer|min:10|max:300',
            'volume'                  => 'sometimes|numeric|min:0|max:1',
            'push_channel_id'         => 'sometimes|string|max:64',
        ]);

        $current = $service->sound_settings ?? [];
        $service->update(['sound_settings' => array_merge(self::DEFAULTS, $current, $validated)]);

        return response()->json([
            'data' => $this->resolved($service->fresh()),
        ]);
    }

    /**
     * Upload a custom sound file for the service (MP3/WAV/OGG, max 2 MB).
     * Stores in public disk and saves the URL in sound_settings.sound_uri.
     */
    public function uploadSound(Request $request, Service $service): JsonResponse
    {
        $request->validate([
            'sound' => 'required|file|mimes:mp3,wav,ogg|max:2048',
        ]);

        $file = $request->file('sound');
        $path = $file->storeAs(
            'services/sounds',
            'service_' . $service->id . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension(),
            'public'
        );

        $url = Storage::disk('public')->url($path);

        $current = $service->sound_settings ?? [];
        $service->update([
            'sound_settings' => array_merge(self::DEFAULTS, $current, ['sound_uri' => $url]),
        ]);

        return response()->json([
            'data' => $this->resolved($service->fresh()),
        ]);
    }

    /**
     * Remove the custom sound and revert to the bundled default.
     */
    public function deleteSound(Service $service): JsonResponse
    {
        $current = $service->sound_settings ?? [];
        $service->update([
            'sound_settings' => array_merge(self::DEFAULTS, $current, ['sound_uri' => null]),
        ]);

        return response()->json([
            'data' => $this->resolved($service->fresh()),
        ]);
    }

    private function resolved(Service $service): array
    {
        return array_merge(self::DEFAULTS, $service->sound_settings ?? []);
    }
}
