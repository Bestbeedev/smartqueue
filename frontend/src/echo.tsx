import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// laravel-echo expects a global Pusher constructor in some setups
(globalThis as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'smartqueue_key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT || 6001,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
});

export default echo;
