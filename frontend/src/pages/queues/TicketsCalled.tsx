import { useEffect, useState } from 'react';
import { getEcho } from '@/api/echo';
import { FaTicketAlt, FaUserClock, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/api/axios';

type Ticket = {
  id: number;
  number: string;
  status: string;
  called_at: string | null;
  created_at: string;
};

export default function TicketsCalled() {
  const [serviceId, setServiceId] = useState<string>('');
  const [rows, setRows] = useState<Ticket[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load existing called tickets from API
  const loadCalledTickets = async (numericId: number) => {
    try {
      const response = await api.get('/api/agent/tickets', {
        params: {
          service_id: numericId,
          status: 'called',
          per_page: 50,
        }
      });
      const tickets = response.data?.data || [];
      setRows(tickets.map((t: any) => ({
        id: t.id,
        number: t.number,
        status: t.status,
        called_at: t.called_at,
        created_at: t.created_at,
      })));
      return true;
    } catch (e: any) {
      console.error('Error loading called tickets:', e);
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
      setRows([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    const echo = getEcho();

    // First load existing tickets from API
    loadCalledTickets(numericId).then((success) => {
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

        channel.listen('.service.ticket.called', (e: any) => {
          const t = e?.ticket;
          if (!t) return;
          setRows(prev => {
            // Avoid duplicates
            if (prev.some(x => x.id === t.id)) return prev;
            return [{
              id: t.id,
              number: t.number,
              status: 'called',
              called_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            }, ...prev].slice(0, 50);
          });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId.trim()) {
      toast.error('Veuillez entrer un identifiant de service');
      return;
    }
    setIsLoading(true);
    setRows([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto space-y-6">
        <div className="bg-card rounded-xl shadow-xl border border-border overflow-hidden">
          <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaTicketAlt className="text-white text-2xl" />
                <h1 className="text-xl font-semibold text-white">Tickets Appelés</h1>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-white/90">
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="mb-6">
              <label htmlFor="serviceId" className="block text-sm font-medium text-foreground mb-1">
                ID du Service
              </label>
              <div className="flex space-x-2">
                <input
                  id="serviceId"
                  type="number"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  placeholder="Entrez l'ID du service"
                  className="flex-1 bg-background min-w-0 block w-full px-3 py-2 rounded-md border border-border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Charger
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground flex items-center">
                <FaInfoCircle className="mr-1.5" /> Entrez l'ID du service pour commencer à recevoir les mises à jour
              </p>
            </form>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : serviceId && !error ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-foreground">Derniers tickets appelés</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                    {rows.length} {rows.length <= 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>

                {rows.length > 0 ? (
                  <div className="overflow-hidden border border-border rounded-lg">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            N° Ticket
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Heure d'appel
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {rows.map((ticket) => (
                          <tr key={ticket.id} className="hover-card">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                  <FaTicketAlt />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-foreground">
                                    {ticket.number || `#${ticket.id}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">
                                {ticket.called_at ? new Date(ticket.called_at).toLocaleTimeString() : '—'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {ticket.called_at ? new Date(ticket.called_at).toLocaleDateString() : '—'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                Appelé
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                    <FaTicketAlt className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">Aucun ticket appelé</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Les tickets appelés apparaîtront ici en temps réel.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
