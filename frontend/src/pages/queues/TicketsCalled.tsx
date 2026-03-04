import { useEffect, useState } from 'react';
import { getEcho } from '@/api/echo';
import { FaTicketAlt, FaUserClock, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TicketsCalled() {
  const [serviceId, setServiceId] = useState<number | ''>('' as any);
  const [rows, setRows] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const numericId = Number(serviceId);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const echo = getEcho();

    let channel: any;
    try {
      channel = echo.join(`presence-service.${numericId}`)
        .here(() => {
          setIsConnected(true);
          setIsLoading(false);
        })
        .error(() => {
          setIsConnected(false);
          setIsLoading(false);
        });

      channel.listen('.service.ticket.called', (e: any) => {
        setRows(prev => [{
          id: e?.ticket?.id,
          number: e?.ticket?.number,
          at: new Date(),
          status: 'called'
        }, ...prev].slice(0, 50));
      });
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setIsConnected(false);
      setIsLoading(false);
    }

    return () => {
      try {
        channel?.stopListening?.('.service.ticket.called');
      } catch (_) {}
      echo.leave(`presence-service.${numericId}`);
      setIsConnected(false);
    };
  }, [serviceId]);

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
            <div className="mb-6">
              <label htmlFor="serviceId" className="block text-sm font-medium text-foreground mb-1">
                ID du Service
              </label>
              <div className="flex space-x-2">
                <input
                  id="serviceId"
                  type="number"
                  value={serviceId as any}
                  onChange={(e) => setServiceId(Number(e.target.value) || ('' as any))}
                  placeholder="Entrez l'ID du service"
                  className="flex-1 bg-background min-w-0 block w-full px-3 py-2 rounded-md border border-border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground flex items-center">
                <FaInfoCircle className="mr-1.5" /> Entrez l'ID du service pour commencer à recevoir les mises à jour
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : serviceId ? (
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
                        {rows.map((ticket, index) => (
                          <tr key={`${ticket.id}-${index}`} className="hover-card">
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
                                {ticket.at.toLocaleTimeString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {ticket.at.toLocaleDateString()}
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
            ) : (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <FaTicketAlt className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">Sélectionnez un service</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Entrez l'ID d'un service pour afficher les tickets appelés en temps réel.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
