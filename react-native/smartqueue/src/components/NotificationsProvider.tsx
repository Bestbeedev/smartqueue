/**
 * NotificationsProvider — point de montage unique du système de notifications push.
 *
 * Ce composant DOIT être monté à la racine de l'app (app/_layout.tsx). Sans lui,
 * le hook useNotifications n'est jamais exécuté : aucune permission demandée,
 * aucun token FCM/Expo obtenu, et le token n'est jamais envoyé au backend — ce
 * qui explique l'absence totale de notifications après le build.
 *
 * Responsabilités :
 *  - Charger le handler foreground + créer le canal Android (via useNotifications).
 *  - Demander la permission de notification une fois l'utilisateur connecté.
 *  - Enregistrer le token push auprès du backend (POST /auth/devices/register).
 *  - Gérer le tap sur une notification (app en arrière-plan = onMessageOpenedApp,
 *    app fermée = getLastNotificationResponseAsync) et naviguer en conséquence.
 *
 * L'overlay temps réel (OverlayCalledTicket via useTicketSocket) continue de
 * fonctionner indépendamment ; les deux systèmes coexistent.
 */
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../store/authStore";

function navigateFromNotification(
  router: ReturnType<typeof useRouter>,
  data: Record<string, any> | undefined,
) {
  if (!data) return;
  const ticketId = data.ticket_id ?? data.ticketId;
  try {
    if (ticketId) {
      router.push({
        pathname: "/(tabs)/live-ticket",
        params: { ticketId: String(ticketId) },
      });
    } else {
      router.push("/notifications");
    }
  } catch (err) {
    console.warn("[Notifications] navigation depuis notif échouée:", err);
  }
}

export default function NotificationsProvider() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    checkPermission,
    requestPermission,
    registerFCMToken,
    initializeNotifications,
  } = useNotifications();

  const registeredRef = useRef(false);

  // Permission + enregistrement du token dès que l'utilisateur est connecté.
  useEffect(() => {
    if (!isAuthenticated) {
      registeredRef.current = false;
      return;
    }
    if (registeredRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        await initializeNotifications();
        let perm = await checkPermission();
        if (!perm.granted && perm.canAskAgain) {
          perm = await requestPermission();
        }
        if (perm.granted && !cancelled) {
          await registerFCMToken();
          registeredRef.current = true;
        }
      } catch (err) {
        console.error("[Notifications] provider init:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    initializeNotifications,
    checkPermission,
    requestPermission,
    registerFCMToken,
  ]);

  // Tap sur une notification quand l'app est en arrière-plan (onMessageOpenedApp).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<
          string,
          any
        >;
        navigateFromNotification(router, data);
      },
    );
    return () => sub.remove();
  }, [router]);

  // Tap sur une notification quand l'app était fermée/terminée (getInitialNotification).
  useEffect(() => {
    let handled = false;
    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last && !handled) {
        handled = true;
        const data = last.notification.request.content.data as Record<
          string,
          any
        >;
        navigateFromNotification(router, data);
      }
    })();
  }, [router]);

  return null;
}
