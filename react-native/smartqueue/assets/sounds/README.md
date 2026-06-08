# Sound assets

Place `ticket_called.mp3` here (MP3, ≤ 2 s, ≤ 100 kB recommended).

The file is referenced in `useCalledTicketSound.ts`:
```ts
const DEFAULT_SOUND = require('../../assets/sounds/ticket_called.mp3');
```

If the file is missing the hook silently degrades to vibration-only via expo-haptics.
