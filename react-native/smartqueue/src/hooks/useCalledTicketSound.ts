import { useEffect, useRef, useCallback } from "react";
import { useAudioPlayer, AudioSource } from "expo-audio";
import * as Haptics from "expo-haptics";

// Drop ticket_called.mp3 in assets/sounds/ to enable bundled audio.
// The try/catch lets the hook compile even when the file is absent.
let DEFAULT_SOUND_SOURCE: AudioSource | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DEFAULT_SOUND_SOURCE = require("../../assets/sounds/ticket_called.mp3") as AudioSource;
} catch {
  // file not yet added — hook degrades to haptics only
}

export interface CalledTicketSoundConfig {
  /** Play audio alerts. Defaults to true. */
  enabled?: boolean;
  /** Custom sound — a remote URI or another require(). Null = bundled default. */
  soundSource?: AudioSource | null;
  /** Seconds between repeated plays while overlay is visible. Default 30. */
  repeatIntervalSeconds?: number;
  /** Volume 0–1. Default 1. */
  volume?: number;
}

interface UseCalledTicketSoundReturn {
  /** Immediately stop audio and clear the repeat timer. */
  stopSound: () => void;
}

/**
 * Plays an alert sound as long as the ticket is in the "called" state.
 *
 * - First play fires instantly when isCalled becomes true.
 * - Subsequent plays repeat every repeatIntervalSeconds until stopSound() is
 *   called or isCalled returns to false.
 * - Falls back to a strong haptic if no sound file is loaded.
 * - All resources are released on unmount.
 */
export function useCalledTicketSound(
  isCalled: boolean,
  config: CalledTicketSoundConfig = {},
): UseCalledTicketSoundReturn {
  const {
    enabled = true,
    soundSource = null,
    repeatIntervalSeconds = 30,
    volume = 1.0,
  } = config;

  const resolvedSource = soundSource ?? DEFAULT_SOUND_SOURCE;

  // useAudioPlayer is a stable hook — passing null disables it gracefully.
  const player = useAudioPlayer(resolvedSource ?? undefined);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const playOnce = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    // Haptic regardless of whether sound is available — gives tactile feedback.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );

    if (!resolvedSource) return;

    try {
      player.volume = Math.max(0, Math.min(1, volume));
      // Rewind before each play so repeated calls always start from 0.
      player.seekTo(0);
      player.play();
    } catch (err) {
      // Audio errors are non-fatal — overlay stays functional without sound.
      console.warn("[useCalledTicketSound] playOnce error:", err);
    }
  }, [enabled, resolvedSource, player, volume]);

  const stopSound = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      player.pause();
    } catch {
      // ignore
    }
  }, [player]);

  useEffect(() => {
    if (!isCalled || !enabled) {
      stopSound();
      return;
    }

    // Immediate first play.
    playOnce();

    // Repeat at the configured interval.
    const ms = Math.max(10_000, repeatIntervalSeconds * 1000);
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        playOnce();
      }
    }, ms);

    return () => {
      stopSound();
    };
  }, [isCalled, enabled, repeatIntervalSeconds, playOnce, stopSound]);

  // Release audio resources on unmount.
  useEffect(() => {
    return () => {
      try {
        player.remove();
      } catch {
        // ignore
      }
    };
    // player identity is stable for the hook's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { stopSound };
}
