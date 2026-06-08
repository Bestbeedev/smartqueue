# Sound assets

## Default sound: `ticket_called.wav`

A generated 880 Hz beep (0.4 s, WAV 8-bit mono 8 kHz) used as the built-in
alert when a ticket is called. The file is bundled with the app via Metro.

To replace it with a higher-quality sound, swap the file keeping the same name,
or upload a custom MP3/WAV/OGG via the admin panel (Admin → Services → Bell icon).
The custom URL from the server then overrides this bundled default at runtime.

## Custom sounds (per service)

Uploaded via `POST /api/admin/services/{id}/sound/upload` (MP3/WAV/OGG ≤ 2 MB).
Stored in `backend/storage/app/public/services/sounds/`.
Referenced in `services.sound_settings.sound_uri` (JSON column).
