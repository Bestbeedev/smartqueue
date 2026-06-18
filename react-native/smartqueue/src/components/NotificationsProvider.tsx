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
 *  - Enregistrer les catégories de notifications pour les actions rapides.
 *  - Gérer le tap sur une notification (app en arrière-plan, fermée) :
 *      - Tap simple → navigation vers LiveTicket
 *      - Action "J'arrive" → POST /tickets/{id}/en-route
 *      - Action "Je reporte" → POST /tickets/{id}/defer
 *      - Action "Je suis là" → POST /tickets/{id}/present
 *
 * L'overlay temps réel (OverlayCalledTicket via useTicketSocket) continue de
 * fonctionner indépendamment ; les deux systèmes coexistent.
 */
import { useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../store/authStore";
import axiosClient from "../api/axiosClient";

const TICKET_CALLED_CATEGORY = "ticket_called";

async function registerNotificationCategories() {
  try {
    await Notifications.setNotificationCategoryAsync(TICKET_CALLED_CATEGORY, [
      {
        identifier: "en-route",
        buttonTitle: "J'arrive",
        options: {
          opensAppToForeground: false,
          isAuthenticationRequired: false,
          isDestructive: false,
        },
      },
      {
        identifier: "defer",
        buttonTitle: "Je reporte",
        options: {
          opensAppToForeground: false,
          isAuthenticationRequired: false,
          isDestructive: false,
        },
      },
      {
        identifier: "present",
        buttonTitle: "Je suis là",
        options: {
          opensAppToForeground: true,
          isAuthenticationRequired: false,
          isDestructive: false,
        },
      },
    ]);
  } catch (err) {
    console.warn("[Notifications] échec enregistrement catégories:", err);
  }
}

async function handleNotificationAction(
  response: Notifications.NotificationResponse,
) {
  const { actionIdentifier, notification } = response;
  if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) return;

  const data = notification.request.content.data as Record<string, any>;
  const ticketId = data?.ticket_id ?? data?.ticketId;
  if (!ticketId) return;

  try {
    switch (actionIdentifier) {
      case "en-route":
        await axiosClient.post(`/tickets/${ticketId}/en-route`);
        break;
      case "defer":
        await axiosClient.post(`/tickets/${ticketId}/defer`);
        break;
      case "present":
        await axiosClient.post(`/tickets/${ticketId}/present`);
        break;
    }
  } catch (err) {
    console.warn(
      `[Notifications] action ${actionIdentifier} échouée:`,
      err,
    );
  }
}

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
  const categoriesRegisteredRef = useRef(false);

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

  // Enregistrer les catégories d'actions une fois (Android/iOS).
  useEffect(() => {
    if (categoriesRegisteredRef.current) return;
    categoriesRegisteredRef.current = true;
    registerNotificationCategories();
  }, []);

  // Tap sur une notification quand l'app est en arrière-plan.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const isAction =
          response.actionIdentifier !==
          Notifications.DEFAULT_ACTION_IDENTIFIER;

        if (isAction) {
          await handleNotificationAction(response);
          return;
        }

        const data = response.notification.request.content.data as Record<
          string,
          any
        >;
        navigateFromNotification(router, data);
      },
    );
    return () => sub.remove();
  }, [router]);

  // Tap sur une notification quand l'app était fermée/terminée.
  useEffect(() => {
    let handled = false;
    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last && !handled) {
        handled = true;
        const isAction =
          last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER;

        if (isAction) {
          await handleNotificationAction(last);
          return;
        }

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
