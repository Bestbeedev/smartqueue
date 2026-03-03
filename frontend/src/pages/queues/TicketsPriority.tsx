import React, { useState, useEffect } from 'react';
import { FaStar, FaCrown, FaTicketAlt, FaSyncAlt, FaUserTie } from 'react-icons/fa';
import { getEcho } from '@/api/echo';
import { cn } from '@/lib/utils';

type Ticket = {
  id: number;
  ticket_number: string;
  service_id: number;
  service_name: string;
  created_at: string;
  client_name?: string;
  priority: string;
};

const TicketsPriority: React.FC = () => {
  const [serviceId, setServiceId] = useState<string>('');
  const [priorityTickets, setPriorityTickets] = useState<Ticket[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const echo = getEcho();

  useEffect(() => {
    const numericId = Number(serviceId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    // Réinitialiser l'état lors du changement de service
    setPriorityTickets([]);
    setIsLoading(true);

    // S'abonner au canal de présence pour le service
    let channel: any;
    try {
      channel = echo.join(`presence-service.${numericId}`)
        .here(() => {
          setIsConnected(true);
          setIsLoading(false);
          setLastUpdated(new Date().toLocaleTimeString());
        })
        .error(() => {
          setIsConnected(false);
          setIsLoading(false);
        });

      channel.listen('.service.ticket.enqueued', (e: any) => {
        const t = e?.ticket;
        if (!t) return;
        if (t.priority === 'high' || t.priority === 'vip') {
          const newTicket = {
            id: t.id,
            ticket_number: t.ticket_number ?? t.number ?? String(t.id),
            service_id: t.service_id,
            service_name: t.service_name ?? `Service ${t.service_id}`,
            created_at: t.created_at ?? t.updated_at,
            client_name: t.client_name,
            priority: t.priority,
          };

          setPriorityTickets(prevTickets => {
            if (!prevTickets.some(x => x.id === newTicket.id)) {
              return [newTicket, ...prevTickets].slice(0, 50);
            }
            return prevTickets;
          });

          setLastUpdated(new Date().toLocaleTimeString());
        }
      });
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setIsConnected(false);
      setIsLoading(false);
    }

    return () => {
      try {
        channel?.stopListening?.('.service.ticket.enqueued');
      } catch (_) {}
      echo.leave(`presence-service.${numericId}`);
      setIsConnected(false);
    };
  }, [serviceId]);

  const handleServiceIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId.trim()) return;
    setIsLoading(true);
    setPriorityTickets([]);
  };

  const refreshData = () => {
    if (!serviceId) return;
    // La reconnexion se fera automatiquement via l'effet
    setIsLoading(true);
    setPriorityTickets([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = 'px-3 py-1 text-xs font-bold rounded-full flex items-center';
    
    switch (priority) {
      case 'vip':
        return (
          <span className={`${baseClasses} bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-md`}>
            <FaCrown className="mr-1.5 text-yellow-300" /> VIP
          </span>
        );
      case 'high':
        return (
          <span className={`${baseClasses} bg-gradient-to-r from-red-600 to-red-700 text-white`}>
            <FaStar className="mr-1.5 text-yellow-300" /> Haute
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-muted text-foreground`}>
            Normale
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-gray-50 p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Chargement en cours</h2>
          <p className="text-muted-foreground mb-6">Connexion au service {serviceId}...</p>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Trier les tickets par priorité (VIP d'abord, puis haute priorité)
  const sortedTickets = [...priorityTickets].sort((a, b) => {
    if (a.priority === 'vip' && b.priority !== 'vip') return -1;
    if (a.priority !== 'vip' && b.priority === 'vip') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Compter les tickets par priorité
  const vipCount = priorityTickets.filter(t => t.priority === 'vip').length;
  const highPriorityCount = priorityTickets.filter(t => t.priority === 'high').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden mb-8 border border-border">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Gestion des priorités</h1>
                <p className="text-purple-100 mt-1">Surveillez les clients VIP et les tickets prioritaires</p>
              </div>
              {lastUpdated && (
                <div className="mt-4 md:mt-0 text-sm bg-purple-700 bg-opacity-50 px-3 py-1.5 rounded-full inline-flex items-center">
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
                  <label htmlFor="serviceId" className="block text-sm font-medium text-foreground mb-1">
                    Identifiant du service
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaTicketAlt className="h-5 w-5 text-purple-500" />
                    </div>
                    <input
                      type="text"
                      id="serviceId"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      placeholder="Entrez l'ID du service"
                      className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 pr-12  border-border rounded-lg text-base bg-background placeholder:text-muted-foreground"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="submit"
                        className="p-2 text-purple-600 rounded-full hover:text-purple-800 focus:outline-none hover:bg-purple-50 dark:hover:bg-purple-900/20"
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
                    className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                  >
                    <FaStar className="mr-2" />
                    Afficher les priorités
                  </button>
                </div>
              </div>
            </form>

            {serviceId && (
              <div className="mt-4 flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-foreground">
                  {isConnected 
                    ? `Surveillance active du service ${serviceId}` 
                    : 'En attente de connexion...'}
                </span>
                {isConnected && (
                  <button 
                    onClick={refreshData}
                    className="ml-4 text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded transition-colors"
                  >
                    <FaSyncAlt className="mr-1 h-3.5 w-3.5" />
                    Actualiser
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Statistiques rapides */}
          {priorityTickets.length > 0 && (
            <div className="p-6 border-b border-border bg-purple-50/50 dark:bg-purple-900/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-card p-5 rounded-xl border border-purple-200 dark:border-purple-800/30 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
                      <FaStar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total des priorités</p>
                      <p className="text-2xl font-bold text-foreground">{priorityTickets.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
                      <FaCrown className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Clients VIP</p>
                      <p className="text-2xl font-bold text-foreground">{vipCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                      <FaStar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Haute priorité</p>
                      <p className="text-2xl font-bold text-foreground">{highPriorityCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des tickets prioritaires */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center">
                <FaStar className="mr-2 text-purple-600" />
                Tickets prioritaires
              </h2>
              {priorityTickets.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                    <FaCrown className="mr-1 text-yellow-500" /> {vipCount} VIP
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                    <FaStar className="mr-1 text-red-500" /> {highPriorityCount} Haute
                  </span>
                </div>
              )}
            </div>

            {priorityTickets.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                <FaUserTie className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground">
                  {serviceId ? 'Aucun ticket prioritaire' : 'Aucun service sélectionné'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  {serviceId 
                    ? "Les tickets prioritaires (VIP/Haute) apparaîtront ici en temps réel." 
                    : "Veuillez entrer un ID de service pour commencer la surveillance."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Numéro
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Détails
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Priorité
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Créé
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {sortedTickets.map((ticket) => {
                        const { time, date } = formatDate(ticket.created_at);
                        const isVip = ticket.priority === 'vip';
                        
                        return (
                          <tr 
                            key={ticket.id} 
                            className={`transition-colors hover-card ${
                              isVip 
                                ? 'bg-gradient-to-r from-purple-50 to-white' 
                                : ''
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${
                                  isVip 
                                    ? 'bg-gradient-to-br from-purple-100 to-purple-200 shadow-md' 
                                    : 'bg-red-100'
                                }`}>
                                  {isVip ? (
                                    <FaCrown className="h-5 w-5 text-purple-600" />
                                  ) : (
                                    <FaStar className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className={`text-lg font-bold ${
                                    isVip ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'
                                  }`}>
                                    {ticket.ticket_number}
                                  </div>
                                  <div className="text-xs text-muted-foreground">#{ticket.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-foreground">{ticket.service_name}</div>
                              <div className="text-xs text-muted-foreground">Service ID: {ticket.service_id}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-foreground">
                                {ticket.client_name || 'Client non renseigné'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getPriorityBadge(ticket.priority)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground font-medium">{time}</div>
                              <div className="text-xs text-muted-foreground">{date}</div>
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
          <p>Système de gestion des priorités en temps réel • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default TicketsPriority;
