/**
 * Router Configuration - Structure optimisée
 * Organisation des routes par fonctionnalités avec lazy loading
 */
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Suspense, lazy } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/store";
import { refreshMe } from "@/store/authSlice";
import { useEffect } from "react";

// Lazy loading des pages pour optimiser le bundle
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const DashboardRedirect = lazy(() => import("@/pages/dashboard/DashboardRedirect"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const SubscriptionPlan = lazy(() => import("@/pages/auth/Subscription"));

// Pages queues
const QueuesList = lazy(() => import("@/pages/queues/Queues"));
const TicketsCalled = lazy(() => import("@/pages/queues/TicketsCalled"));
const TicketsAbsent = lazy(() => import("@/pages/queues/TicketsAbsent"));
const TicketsPriority = lazy(() => import("@/pages/queues/TicketsPriority"));

// Pages admin
const Agents = lazy(() => import("@/pages/admin/Agents"));
const Services = lazy(() => import("@/pages/admin/Services"));
const Establishments = lazy(() => import("@/pages/admin/Establishments"));
const Stats = lazy(() => import("@/pages/admin/Stats"));

// Pages SaaS
const SaasMonitoring = lazy(() => import("@/pages/saas/SaasMonitoring"));
const SaasEstablishments = lazy(
  () => import("@/pages/saas/SaasEstablishments"),
);
const SaasSubscriptions = lazy(() => import("@/pages/saas/SaasSubscriptions"));

// Setup onboarding admin
const SetupEstablishment = lazy(
  () => import("@/pages/onboarding/SetupEstablishment"),
);

// Pages communes
const Settings = lazy(() => import("@/pages/Settings"));

// Composant de chargement
const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-6">
        {/* Glow */}
        <div className="absolute w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />

        {/* Spinner ring */}
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-4 " />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="text-lg font-medium tracking-wide">Chargement</p>
          <p className="text-sm text-muted-foreground animate-pulse">
            Préparation de votre expérience...
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Router() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated) return;
    // Ensure we have a fresh user (incl. establishment_id) after reload/login
    if (!user?.establishment_id && user?.role === "admin") {
      dispatch(refreshMe());
    }
  }, [dispatch, isAuthenticated]);

  const router = createBrowserRouter([
    {
      path: "/login",
      element: (
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      ),
    },
    {
      path: "/signup",
      element: (
        <Suspense fallback={<PageLoader />}>
          <Signup />
        </Suspense>
      ),
    },
    {
      path: "/subscription",
      element: (
        <Suspense fallback={<PageLoader />}>
          <SubscriptionPlan />
        </Suspense>
      ),
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<PageLoader />}>
              <DashboardRedirect />
            </Suspense>
          ),
        },
        ...(user?.role === "admin" && !user?.establishment_id
          ? [
              {
                path: "setup-establishment",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <SetupEstablishment />
                  </Suspense>
                ),
              },
            ]
          : []),
        {
          path: "queues",
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <QueuesList />
                </Suspense>
              ),
            },
            {
              path: "called",
              element: (
                <Suspense fallback={<PageLoader />}>
                  <TicketsCalled />
                </Suspense>
              ),
            },
            {
              path: "absent",
              element: (
                <Suspense fallback={<PageLoader />}>
                  <TicketsAbsent />
                </Suspense>
              ),
            },
            {
              path: "priority",
              element: (
                <Suspense fallback={<PageLoader />}>
                  <TicketsPriority />
                </Suspense>
              ),
            },
          ],
        },
        // Routes admin (protégées)
        ...(user?.role === "admin" && !!user?.establishment_id
          ? [
              {
                path: "agents",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <Agents />
                  </Suspense>
                ),
              },
              {
                path: "services",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <Services />
                  </Suspense>
                ),
              },
              {
                path: "establishments",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <Establishments />
                  </Suspense>
                ),
              },
              {
                path: "stats",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <Stats />
                  </Suspense>
                ),
              },
            ]
          : []),
        // Routes SaaS (protégées - uniquement super_admin)
        ...(user?.role === "super_admin"
          ? [
              {
                path: "saas/monitoring",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <SaasMonitoring />
                  </Suspense>
                ),
              },
              {
                path: "saas/establishments",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <SaasEstablishments />
                  </Suspense>
                ),
              },
              {
                path: "saas/subscriptions",
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <SaasSubscriptions />
                  </Suspense>
                ),
              },
            ]
          : []),
        {
          path: "settings",
          element: (
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "*",
      element: (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground selection:bg-primary/30">
          {/* Optionnel : Un cercle décoratif flou en arrière-plan pour la profondeur */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-md w-full px-6 text-center">
            {/* L'identifiant d'erreur avec un style imposant */}
            <h1 className="text-9xl font-black tracking-tighter text-blue-500 leading-none mb-12">
              404
            </h1>

            <div className="relative -mt-12">
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                Oups ! Page perdue.
              </h2>
              <p className="text-muted-foreground text-lg mb-5 balance">
                Désolé, la page que vous recherchez semble avoir déménagé ou n'a
                jamais existé.
              </p>

              {/* Bouton stylisé avec transition */}
              <a
                href="/"
                className="inline-flex items-center justify-center h-12 px-8 font-medium tracking-wide text-primary-foreground transition duration-200 rounded-full bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none focus:ring-offset-background active:scale-95"
              >
                Retour à la navigation
              </a>
            </div>
          </div>
        </div>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
}
