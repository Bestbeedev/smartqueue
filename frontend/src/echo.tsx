import Echo from "laravel-echo";
import Pusher from "pusher-js";

// laravel-echo expects a global Pusher constructor in some setups
(globalThis as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

const reverbHost = import.meta.env.VITE_REVERB_HOST || "localhost";
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 6001);
const reverbScheme = (import.meta.env.VITE_REVERB_SCHEME || "http") as string;

const forceTLS = reverbScheme === "https" || reverbPort === 443;

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY || "smartqueue_key",
  wsHost: reverbHost,
  // Ne pas passer le port pour les valeurs par défaut (80/443)
  // pusher-js insère "/:PORT/" dans le chemin quand le port est défini explicitement
  wsPort: !forceTLS && reverbPort !== 80 ? reverbPort : undefined,
  wssPort: forceTLS && reverbPort !== 443 ? reverbPort : undefined,
  forceTLS,
  enabledTransports: ["ws", "wss"],
});

export default echo;
