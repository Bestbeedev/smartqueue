/**
 * useLocationReporter — "Smart Departure" côté serveur.
 *
 * Tant qu'un ticket est actif (waiting/called), on remonte périodiquement la
 * position GPS au backend (POST /tickets/{id}/location). Le serveur en déduit
 * `estimated_travel_minutes` et peut alors déclencher le rappel LEAVE
 * (« c'est le moment de partir ») même quand l'app passe en arrière-plan ou
 * est fermée — ce qui réduit les absences.
 *
 * Best-effort : si la permission n'est pas accordée ou si la position échoue,
 * on n'interrompt rien. On ne sollicite la permission qu'une seule fois.
 */
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import ticketsApi from "../api/ticketsApi";

const REPORT_INTERVAL_MS = 120_000; // 2 min

export function useLocationReporter(
  ticketId: number | null | undefined,
  status: string | null | undefined,
) {
  const askedRef = useRef(false);
  const lastSentRef = useRef(0);

  const isActive = !!ticketId && (status === "waiting" || status === "called");

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;

    const reportOnce = async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (
          perm.status !== Location.PermissionStatus.GRANTED &&
          perm.canAskAgain &&
          !askedRef.current
        ) {
          askedRef.current = true;
          perm = await Location.requestForegroundPermissionsAsync();
        }
        if (perm.status !== Location.PermissionStatus.GRANTED) return;

        const now = Date.now();
        if (now - lastSentRef.current < REPORT_INTERVAL_MS - 1000) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        lastSentRef.current = now;
        await ticketsApi.reportLocation(
          Number(ticketId),
          pos.coords.latitude,
          pos.coords.longitude,
        );
      } catch (err: any) {
        console.warn(
          "[useLocationReporter] report failed:",
          err?.message || err,
        );
      }
    };

    // Premier envoi immédiat, puis à intervalle régulier.
    reportOnce();
    const timer = setInterval(reportOnce, REPORT_INTERVAL_MS);

    // Renvoie aussi quand l'app revient au premier plan.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") reportOnce();
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      sub.remove();
    };
  }, [isActive, ticketId]);
}

export default useLocationReporter;
