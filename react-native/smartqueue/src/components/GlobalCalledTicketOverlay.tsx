import React, { useCallback, useEffect, useRef, useState } from "react";
import { CalledTicketOverlay } from "./CalledTicketOverlay";
import { useTicket, useTicketStore } from "../store/ticketStore";
import { useDistanceTracking } from "../hooks/useDistanceTracking";
import {
  useCalledTicketSound,
  CalledTicketSoundConfig,
} from "../hooks/useCalledTicketSound";
import axiosClient from "../api/axiosClient";
import { getApiErrorMessage } from "../utils/errors";
import { useRouter } from "expo-router";
import { CustomAlert } from "../components/ui/CustomAlert";

interface GlobalCalledTicketOverlayProps {
  showSuccess: (title: string, message: string, buttonText?: string, onPress?: () => void) => void;
  showError: (title: string, message: string, buttonText?: string, onPress?: () => void) => void;
  showWarning: (title: string, message: string, buttonText?: string, onPress?: () => void) => void;
}

export const GlobalCalledTicketOverlay: React.FC<GlobalCalledTicketOverlayProps> = ({ 
  showSuccess, showError, showWarning 
}) => {
  const {
    activeTicket,
    isCalled,
    hasRecalled,
    hasDeferred,
    counterNumber,
    clearCalled,
    setRecalled,
    resetRecall,
    setDeferred,
    resetDeferred,
    fetchActiveTicket,
    markEnRoute,
    markPresent,
  } = useTicket();

  const router = useRouter();
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [localCountdown, setLocalCountdown] = useState<number | null>(null);
  const [countdownReady, setCountdownReady] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [callTimeoutMinutes, setCallTimeoutMinutes] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownFetchedRef = useRef(false);
  const countdownRef = useRef<number | null>(null);
  
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'en_route' | 'present' | 'defer';
    callback: () => void;
  } | null>(null);
  const [expiredAlertVisible, setExpiredAlertVisible] = useState(false);

  const effectiveTicketId = activeTicket?.id || null;

  const [soundConfig] = useState<CalledTicketSoundConfig>({
    enabled: true,
    repeatIntervalSeconds: 30,
  });

  const { stopSound } = useCalledTicketSound(isCalled, soundConfig);

  const hasValidCoordinates = activeTicket?.establishment &&
    (activeTicket.establishment as any)?.lat != null &&
    (activeTicket.establishment as any)?.lng != null;

  const { distanceInfo } = useDistanceTracking({
    targetCoordinates: hasValidCoordinates
      ? { latitude: (activeTicket!.establishment as any).lat, longitude: (activeTicket!.establishment as any).lng }
      : null,
    enabled: hasValidCoordinates && !!activeTicket,
  });

  const fetchCountdown = useCallback(async () => {
    if (!effectiveTicketId) return;
    try {
      const response = await axiosClient.get(`/tickets/${effectiveTicketId}/countdown`);
      const data = response.data;
      if (data?.countdown_seconds != null) {
        const serverSeconds = Math.max(0, Math.floor(Number(data.countdown_seconds)));
        if (!countdownFetchedRef.current) {
          countdownRef.current = serverSeconds;
          setCountdownSeconds(serverSeconds);
          setLocalCountdown(serverSeconds);
          setCountdownReady(true);
          countdownFetchedRef.current = true;
        } else {
          setCountdownSeconds((prev) => prev === null ? serverSeconds : Math.min(prev, serverSeconds));
        }
      }
      if (data?.call_timeout_minutes != null) {
        setCallTimeoutMinutes(Number(data.call_timeout_minutes));
      }
      if (data && !data.is_called) {
        await fetchActiveTicket();
        clearCalled();
      }
    } catch (error: any) {
      console.warn("[GlobalCalledTicketOverlay] countdown fetch error", error?.message);
      if (!countdownFetchedRef.current) {
        setCountdownReady(true);
      }
    }
  }, [effectiveTicketId, fetchActiveTicket, clearCalled]);

  useEffect(() => {
    if (!isCalled || isExpired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (countdownRef.current == null) return;

    intervalRef.current = setInterval(() => {
      if (countdownRef.current == null) return;
      countdownRef.current -= 1;
      setLocalCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsExpired(true);
        setExpiredAlertVisible(true);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCalled, isExpired, countdownReady]);

  useEffect(() => {
    if (!isCalled || isExpired) return;

    fetchCountdown();
    const interval = setInterval(fetchCountdown, 5000);

    return () => clearInterval(interval);
  }, [isCalled, isExpired, fetchCountdown]);

  useEffect(() => {
    if (!isCalled) {
      countdownRef.current = null;
      setLocalCountdown(null);
      setIsExpired(false);
      setCountdownSeconds(null);
      setCountdownReady(false);
      countdownFetchedRef.current = false;
      setCallTimeoutMinutes(null);
      setExpiredAlertVisible(false);
    }
  }, [isCalled]);

  // Fonction d'exécution de l'action après confirmation
  const executeConfirmedAction = useCallback(async () => {
    if (!confirmAction) return;
    
    const { type, callback } = confirmAction;
    setConfirmVisible(false);
    
    // Exécuter l'action réelle
    await callback();
    
    setConfirmAction(null);
  }, [confirmAction]);

  // Action "En route" avec confirmation
  const handleEnRouteWithConfirm = useCallback(() => {
    setConfirmAction({
      type: 'en_route',
      callback: async () => {
        if (!effectiveTicketId) return;
        try {
          const payload: { estimated_travel_minutes?: number } = {};
          const rawTravel = distanceInfo?.travelTimes?.car;
          if (typeof rawTravel === "number" && Number.isFinite(rawTravel)) {
            payload.estimated_travel_minutes = Math.min(60, Math.max(1, Math.round(rawTravel)));
          }
          const response = await axiosClient.post(`/tickets/${effectiveTicketId}/en-route`, payload);
          const updatedTicket = response.data?.data || response.data;
          if (updatedTicket?.en_route_at) {
            const s = useTicketStore.getState();
            if (s.activeTicket?.id === effectiveTicketId) {
              useTicketStore.setState({
                activeTicket: {
                  ...s.activeTicket,
                  status: "en_route",
                  en_route_at: updatedTicket.en_route_at,
                  en_route_expires_at: updatedTicket.en_route_expires_at ?? null,
                },
                activeTickets: s.activeTickets.map((t: any) =>
                  t.id === effectiveTicketId
                    ? { ...t, status: "en_route", en_route_at: updatedTicket.en_route_at, en_route_expires_at: updatedTicket.en_route_expires_at ?? null }
                    : t
                ),
              });
            }
          }
          stopSound();
          markEnRoute();
          const graceMinutes = response.data?.grace_minutes ?? 10;
          showSuccess(
            "En route confirmé !",
            `Vous avez ${graceMinutes} minute${graceMinutes > 1 ? "s" : ""} pour vous présenter à l'établissement.`,
            "OK",
            () => { fetchActiveTicket().catch(console.warn); }
          );
        } catch (error: any) {
          showError("Erreur", getApiErrorMessage(error, "Impossible de confirmer"));
        }
      }
    });
    setConfirmVisible(true);
  }, [effectiveTicketId, distanceInfo, markEnRoute, showSuccess, showError, stopSound, fetchActiveTicket]);

  // Action "Présent" avec confirmation
  const handlePresentWithConfirm = useCallback(() => {
    setConfirmAction({
      type: 'present',
      callback: async () => {
        if (!effectiveTicketId) return;
        try {
          await axiosClient.post(`/tickets/${effectiveTicketId}/present`);
          const s = useTicketStore.getState();
          if (s.activeTicket?.id === effectiveTicketId) {
            useTicketStore.setState({
              activeTicket: { ...s.activeTicket, status: "closed", closed_at: new Date().toISOString() },
              activeTickets: s.activeTickets.map((t: any) =>
                t.id === effectiveTicketId ? { ...t, status: "closed", closed_at: new Date().toISOString() } : t
              ),
            });
          }
          stopSound();
          clearCalled();
          resetRecall();
          resetDeferred();
          showSuccess("Ticket clos ✔", "Merci de votre visite !", "OK", async () => {
            useTicketStore.setState({ activeTicket: null, activeTickets: [] });
            try { await fetchActiveTicket(); } catch (e) { /* ignore */ }
            router.replace("/(tabs)");
          });
        } catch (error: any) {
          showError("Erreur", getApiErrorMessage(error, "Impossible de confirmer la présence"));
        }
      }
    });
    setConfirmVisible(true);
  }, [effectiveTicketId, clearCalled, resetRecall, resetDeferred, showSuccess, showError, router, stopSound, fetchActiveTicket]);

  // Action "Defer" avec confirmation
  const handleDeferWithConfirm = useCallback(() => {
    if (hasDeferred) return;
    
    setConfirmAction({
      type: 'defer',
      callback: async () => {
        if (!effectiveTicketId) return;
        try {
          const response = await axiosClient.post(`/tickets/${effectiveTicketId}/defer`);
          if (response.data.success) {
            setDeferred();
            showSuccess("Position échangée", response.data.message || "Votre position a été échangée", "OK", () => clearCalled());
            await fetchActiveTicket();
          } else {
            showWarning("Information", response.data.message || "Impossible d'échanger la position");
          }
        } catch (error: any) {
          showError("Erreur", getApiErrorMessage(error, "Impossible d'échanger la position"));
        }
      }
    });
    setConfirmVisible(true);
  }, [effectiveTicketId, hasDeferred, setDeferred, fetchActiveTicket, clearCalled, showSuccess, showWarning, showError]);

  // Obtenir le message de confirmation selon l'action
  const getConfirmMessage = () => {
    switch (confirmAction?.type) {
      case 'en_route':
        return {
          title: "Confirmation",
          message: `Vous confirmez être en route vers l'établissement ?\n\nIl vous reste ${(activeTicket?.max_call_attempts ?? 2) - (activeTicket?.absent_level ?? 0)} appel${(activeTicket?.max_call_attempts ?? 2) - (activeTicket?.absent_level ?? 0) > 1 ? 's' : ''} avant l'absence définitive.`,
          confirmText: "Oui, en route",
        };
      case 'present':
        return {
          title: "Confirmation",
          message: "Vous confirmez être déjà présent sur place ?",
          confirmText: "Oui, présent",
        };
      case 'defer':
        return {
          title: "Confirmation",
          message: "Voulez-vous vraiment laisser passer la personne suivante ? Vous perdrez votre place actuelle.",
          confirmText: "Oui, laisser passer",
        };
      default:
        return {
          title: "Confirmation",
          message: "Confirmez-vous cette action ?",
          confirmText: "Confirmer",
        };
    }
  };

  const confirmMsg = confirmAction ? getConfirmMessage() : null;

  const handleRecall = useCallback(async () => {
    if (!effectiveTicketId || hasRecalled) return;
    try {
      const response = await axiosClient.post(`/tickets/${effectiveTicketId}/request-recall`);
      setRecalled();
      const recallSeconds = Math.max(0, Math.floor(Number(response.data.countdown_seconds || 600)));
      countdownRef.current = recallSeconds;
      setCountdownSeconds(recallSeconds);
      setLocalCountdown(recallSeconds);
      showSuccess("Rappel demandé", "Un nouveau compte à rebours de 10 minutes a été accordé.");
    } catch (error: any) {
      const errorMsg = getApiErrorMessage(error, "");
      if (errorMsg.includes("déjà été utilisé") || errorMsg.includes("already been used")) setRecalled();
    }
  }, [effectiveTicketId, hasRecalled, setRecalled, showSuccess]);

  const handleDismiss = useCallback(async () => {
    stopSound();
    clearCalled();
    resetRecall();
    resetDeferred();
    setLocalCountdown(600);
    setIsExpired(false);
    try { await fetchActiveTicket(); } catch (err) { console.warn(err); }
    router.replace("/(tabs)");
  }, [clearCalled, resetRecall, resetDeferred, router, fetchActiveTicket, stopSound]);

  return (
    <>
      <CalledTicketOverlay
        visible={isCalled && !isExpired}
        ticketNumber={activeTicket?.number || ""}
        ticketServiceName={activeTicket?.service?.name || ""}
        counterNumber={counterNumber || undefined}
        distanceInfo={distanceInfo}
        countdownSeconds={localCountdown ?? 0}
        countdownReady={countdownReady}
        callTimeoutMinutes={callTimeoutMinutes}
        hasRecalled={hasRecalled}
        isSwapped={hasDeferred}
        onEnRoute={handleEnRouteWithConfirm}
        onPresent={handlePresentWithConfirm}
        onRecall={handleRecall}
        onDefer={handleDeferWithConfirm}
        onDismiss={handleDismiss}
        absentLevel={activeTicket?.absent_level ?? 0}
        maxCallAttempts={activeTicket?.max_call_attempts ?? 2}
      />
      
      {/* Custom Alert de confirmation */}
      <CustomAlert
        visible={confirmVisible}
        type="warning"
        title={confirmMsg?.title || "Confirmation"}
        message={confirmMsg?.message || "Confirmez-vous cette action ?"}
        primaryButton={{
          text: confirmMsg?.confirmText || "Confirmer",
          onPress: () => {
            executeConfirmedAction();
          },
        }}
        secondaryButton={{
          text: "Annuler",
          onPress: () => {
            setConfirmVisible(false);
            setConfirmAction(null);
          },
        }}
        onClose={() => {
          setConfirmVisible(false);
          setConfirmAction(null);
        }}
      />

      {/* Custom Alert d'expiration */}
      <CustomAlert
        visible={expiredAlertVisible}
        type="warning"
        title="Délai expiré"
        message={(activeTicket?.absent_level ?? 0) + 1 >= (activeTicket?.max_call_attempts ?? 2)
          ? "Vous ne vous êtes pas présenté à temps. Votre ticket a été clôturé suite à plusieurs absences. Vous devez prendre un nouveau ticket."
          : "Vous ne vous êtes pas présenté à temps. Votre ticket a été marqué absent mais peut encore être rappelé."}
        primaryButton={{
          text: "OK",
          onPress: () => {
            setExpiredAlertVisible(false);
            handleDismiss();
          },
        }}
        onClose={() => {
          setExpiredAlertVisible(false);
          handleDismiss();
        }}
      />
    </>
  );
};

export default GlobalCalledTicketOverlay;