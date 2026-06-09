import { useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";

const TICKET_CALLED_SOUND = require("../../assets/sounds/ticket_called.wav");

export interface CalledTicketSoundConfig {
  enabled?: boolean;
  repeatIntervalSeconds?: number;
}

interface UseCalledTicketSoundReturn {
  stopSound: () => void;
}

export function useCalledTicketSound(
  isCalled: boolean,
  config: CalledTicketSoundConfig = {},
): UseCalledTicketSoundReturn {
  const { enabled = true, repeatIntervalSeconds = 30 } = config;

  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const playSound = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    try {
      if (Platform.OS === "ios") {
        Vibration.vibrate([0, 500, 200, 500]);
      } else {
        Vibration.vibrate([0, 800, 300, 800]);
      }
    } catch {}

    try {
      // Unload previous instance before creating a new one
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(TICKET_CALLED_SOUND, {
        shouldPlay: true,
        volume: 1.0,
      });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch (e) {
      console.log("[useCalledTicketSound] audio error:", e);
    }
  }, [enabled]);

  const stopSound = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try { Vibration.cancel(); } catch {}
    try {
      soundRef.current?.stopAsync();
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    } catch {}
  }, []);

  useEffect(() => {
    if (!isCalled || !enabled) {
      stopSound();
      return;
    }

    playSound();

    const intervalMs = Math.max(10000, repeatIntervalSeconds * 1000);
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) playSound();
    }, intervalMs);

    return () => stopSound();
  }, [isCalled, enabled, repeatIntervalSeconds, playSound, stopSound]);

  return { stopSound };
}
