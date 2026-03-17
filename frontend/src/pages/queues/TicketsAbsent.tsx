/**
 * Page d'affichage des tickets marqués comme absents
 * - Affiche la liste des clients absents en temps réel
 * - Permet de filtrer par service
 * - Met à jour automatiquement lors des nouveaux marquages d'absence
 */
import React, { useState, useEffect } from "react";
import {
  FaUserClock,
  FaExclamationTriangle,
  FaTicketAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { getEcho } from "@/api/echo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/api/axios";

type Ticket = {
  id: number;
  number: string;
  status: string;
  service_id: number;
  service_name: string;
  created_at: string;
  absent_at: string | null;
};

const TicketsAbsent: React.FC = () => {
  const [serviceId, setServiceId] = useState<string>("");
  const [absentTickets, setAbsentTickets] = useState<Ticket[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Load existing absent tickets from API
  const loadAbsentTickets = async (numericId: number): Promise<boolean> => {
    try {
      const response = await api.get('/api/agent/tickets', {
        params: {
          service_id: numericId,
          status: 'absent',
          per_page: 50,
        }
      });
      const tickets = response.data?.data || [];
      setAbsentTickets(tickets.map((t: any) => ({
        id: t.id,
        number: t.number,
        status: t.status,
        service_id: t.service?.id || t.service_id,
        service_name: t.service?.name || `Service ${t.service_id}`,
        created_at: t.created_at,
        absent_at: t.absent_at,
      })));
      setLastUpdated(new Date().toLocaleTimeString());
      return true;
    } catch (e: any) {
      console.error('Error loading absent tickets:', e);
      if (e?.response?.status === 404 || e?.response?.status === 403) {
        setError('Service non trouvé ou accès non autorisé');
        return false;
      }
      setError(e?.response?.data?.message || 'Erreur lors du chargement');
      return false;
    }
  };

  useEffect(() => {
    const numericId = Number(serviceId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setIsConnected(false);
      setIsLoading(false);
      setAbsentTickets([]);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");
    const echo = getEcho();

    // First load existing tickets from API
    loadAbsentTickets(numericId).then((success) => {
      if (!success) {
        setIsLoading(false);
        setIsConnected(false);
        return;
      }

      // Then connect to websocket for real-time updates
      let channel: any;
      try {
        channel = echo.join(`service.${numericId}`)
          .here(() => {
            setIsConnected(true);
            setIsLoading(false);
          })
          .error(() => {
            setIsConnected(false);
            setIsLoading(false);
          });

        channel.listen('.service.ticket.absent', (e: any) => {
          const t = e?.ticket;
          if (!t) return;
          setAbsentTickets(prev => {
            // Avoid duplicates
            if (prev.some(x => x.id === t.id)) return prev;
            return [{
              id: t.id,
              number: t.number || t.ticket_number || String(t.id),
              status: 'absent',
              service_id: t.service_id,
              service_name: t.service_name || `Service ${t.service_id}`,
              created_at: t.created_at || new Date().toISOString(),
              absent_at: t.absent_at || new Date().toISOString(),
            }, ...prev];
          });
          setLastUpdated(new Date().toLocaleTimeString());
        });
      } catch (err) {
        console.error('Erreur de connexion:', err);
        setIsConnected(false);
        setIsLoading(false);
      }
    });

    return () => {
      try {
        echo.leave(`service.${numericId}`);
      } catch (_) {}
      setIsConnected(false);
    };
  }, [serviceId]);

  const handleServiceIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId.trim()) {
      toast.error("Veuillez entrer un identifiant de service");
      return;
    }
    setIsLoading(true);
    setAbsentTickets([]);
    setError("");
  };

  const refreshData = () => {
    if (!serviceId) {
      toast.error("Aucun service sélectionné");
      return;
    }
    setIsLoading(true);
    setAbsentTickets([]);
    setError("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-gray-50 p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border-4 " />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            </div>{" "}
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Chargement en cours
          </h2>
          <p className="text-muted-foreground mb-6">
            Connexion au service {serviceId}...
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden mb-8 border border-border">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Gestion des absences
                </h1>
                <p className="text-red-100 mt-1">
                  Surveillez les tickets marqués comme absents en temps réel
                </p>
              </div>
              {lastUpdated && (
                <div className="mt-4 md:mt-0 text-sm bg-red-700 bg-opacity-50 px-3 py-1.5 rounded-full inline-flex items-center">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                  <span>Mis à jour à {lastUpdated}</span>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire de sélection du service */}
          <div className="p-6 border-b border-border">
            <form onSubmit={handleServiceIdSubmit}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <label
                    htmlFor="serviceId"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Identifiant du service
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaTicketAlt className="h-5 w-5 text-red-500" />
                    </div>
                    <input
                      type="text"
                      id="serviceId"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      placeholder="Entrez l'ID du service"
                      className="focus:ring-2 focus:ring-red-500 focus:border-red-500 block w-full pl-10 pr-12  border-border rounded-lg text-base bg-background placeholder:text-muted-foreground"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="submit"
                        className="p-2 text-red-600 rounded-full hover:text-red-800 focus:outline-none hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Actualiser"
                      >
                        <FaSyncAlt className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                  >
                    <FaUserClock className="mr-2" />
                    Afficher les absences
                  </button>
                </div>
              </div>
            </form>

            {serviceId && (
              <div className="mt-4 flex items-center">
                <div
                  className={`h-3 w-3 rounded-full mr-2 ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                <span className="text-sm font-medium text-foreground">
                  {isConnected
                    ? `Surveillance active du service ${serviceId}`
                    : error || "En attente de connexion..."}
                </span>
                {isConnected && (
                  <button
                    onClick={refreshData}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium flex items-center hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                  >
                    <FaSyncAlt className="mr-1 h-3.5 w-3.5" />
                    Actualiser
                  </button>
                )}
              </div>
            )}
          </div>

          {error && !serviceId && (
            <div className="p-4 mx-6 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Statistiques rapides */}
          {absentTickets.length > 0 && (
            <div className="p-6 border-b border-border bg-red-50/50 dark:bg-red-900/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-card p-5 rounded-xl border border-red-200 dark:border-red-800/30 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                      <FaExclamationTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total des absences
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {absentTickets.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-4">
                      <FaUserClock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Dernière absence
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {
                          formatDate(
                            absentTickets[0]?.marked_absent_at ||
                              new Date().toISOString(),
                          ).date
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                      <FaTicketAlt className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Service
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {absentTickets[0]?.service_name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des tickets absents */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center">
                <FaUserClock className="mr-2 text-red-600" />
                Tickets marqués absents
              </h2>
              {absentTickets.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {absentTickets.length}{" "}
                  {absentTickets.length > 1 ? "tickets" : "ticket"}
                </span>
              )}
            </div>

            {absentTickets.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                <FaUserClock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground">
                  {serviceId
                    ? "Aucune absence enregistrée"
                    : "Aucun service sélectionné"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  {serviceId
                    ? "Les tickets marqués comme absents apparaîtront ici en temps réel."
                    : "Veuillez entrer un ID de service pour commencer la surveillance."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Numéro
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Détails
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Client
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Marqué absent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {absentTickets.map((ticket) => {
                        const { time, date } = formatDate(
                          ticket.marked_absent_at || ticket.created_at,
                        );
                        return (
                          <tr key={ticket.id} className="hover-card">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full">
                                  <FaExclamationTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-lg font-bold text-foreground">
                                    {ticket.ticket_number}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    #{ticket.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-foreground">
                                {ticket.service_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Service ID: {ticket.service_id}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-foreground font-medium">
                                {ticket.client_name || "Client non renseigné"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground font-medium">
                                {time}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {date}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Système de gestion des absences en temps réel •{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketsAbsent;
