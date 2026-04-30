import React, { useCallback, useState } from 'react';
import { CalledTicketOverlay } from './CalledTicketOverlay';
import { useTicket } from '../store/ticketStore';
import { useDistanceTracking } from '../hooks/useDistanceTracking';
import { DistanceInfo } from '../utils/distance';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { useTicketSocket } from '../hooks/useTicketSocket';
import axiosClient from '../api/axiosClient';
import { useRouter } from 'expo-router';

/**
 * Global overlay that appears on ANY tab when the user's ticket is called.
 * Placed in the tab layout so it works from every screen.
 */
export const GlobalCalledTicketOverlay: React.FC = () => {
  const {
    activeTicket,
    isCalled,
    hasRecalled,
    counterNumber,
    clearCalled,
    setRecalled,
    fetchActiveTicket,
  } = useTicket();

  const { showError, showSuccess, showWarning } = useCustomAlert();
  const router = useRouter();
  const [countdownSeconds, setCountdownSeconds] = useState(600);

  const effectiveTicketId = activeTicket?.id || null;

  // WebSocket connection - ensures we receive ticket.called events from any tab
  useTicketSocket(effectiveTicketId?.toString() || null);

  // Distance tracking for the overlay
  const hasValidCoordinates = activeTicket?.establishment &&
    (activeTicket.establishment as any)?.lat != null &&
    (activeTicket.establishment as any)?.lng != null;

  const { distanceInfo } = useDistanceTracking({
    targetCoordinates: hasValidCoordinates ? {
      latitude: (activeTicket!.establishment as any).lat,
      longitude: (activeTicket!.establishment as any).lng,
    } : null,
    enabled: hasValidCoordinates && !!activeTicket,
  });

  // Handle "Je suis en route" - confirm presence
  const handleEnRoute = useCallback(async () => {
    if (!effectiveTicketId) return;

    try {
      const payload: any = {};
      if (distanceInfo?.travelTimes?.car) {
        payload.estimated_travel_minutes = distanceInfo.travelTimes.car;
      }
      await axiosClient.post(`/tickets/${effectiveTicketId}/en-route`, payload);
      showSuccess('Confirmation', 'L\'agent a été notifié que vous êtes en route');
      clearCalled(); // Dismiss overlay
    } catch (error: any) {
      showError('Erreur', error.response?.data?.error || 'Impossible de confirmer');
    }
  }, [effectiveTicketId, distanceInfo, clearCalled, showSuccess, showError]);

  // Handle "Me rappeler"
  const handleRecall = useCallback(async () => {
    if (!effectiveTicketId || hasRecalled) return;

    try {
      const response = await axiosClient.post(`/tickets/${effectiveTicketId}/request-recall`);
      setRecalled();
      setCountdownSeconds(response.data.countdown_seconds || 600);
    } catch (error: any) {
      showError('Erreur', error.response?.data?.error || 'Impossible d\'envoyer le rappel');
    }
  }, [effectiveTicketId, hasRecalled, setRecalled, showError]);

  // Handle "Laisser passer" (defer)
  const handleDefer = useCallback(async () => {
    if (!effectiveTicketId) return;

    try {
      const response = await axiosClient.post(`/tickets/${effectiveTicketId}/defer`);
      if (response.data.success) {
        showSuccess('Position échangée', response.data.message || 'Votre position a été échangée avec succès');
        clearCalled(); // Dismiss overlay
        await fetchActiveTicket();
      } else {
        showWarning('Information', response.data.message || 'Impossible d\'échanger la position');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Impossible d\'échanger la position';
      showError('Erreur', errorMsg);
    }
  }, [effectiveTicketId, fetchActiveTicket, clearCalled, showError, showSuccess, showWarning]);

  // Handle dismiss (expired / take new ticket)
  const handleDismiss = useCallback(() => {
    clearCalled();
    router.replace('/(tabs)');
  }, [clearCalled, router]);

  return (
    <CalledTicketOverlay
      visible={isCalled}
      counterNumber={counterNumber || undefined}
      distanceInfo={distanceInfo}
      countdownSeconds={countdownSeconds}
      hasRecalled={hasRecalled}
      onEnRoute={handleEnRoute}
      onRecall={handleRecall}
      onDefer={handleDefer}
      onDismiss={handleDismiss}
    />
  );
};

export default GlobalCalledTicketOverlay;
