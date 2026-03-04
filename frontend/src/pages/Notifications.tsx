import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'ticket' | 'system' | 'queue' | 'user';
  actionUrl?: string;
}

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingNotification, setCreatingNotification] = useState(false);
  
  // Form state for creating notifications
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    category: 'system' as 'ticket' | 'system' | 'queue' | 'user',
    targetRole: 'all' as 'all' | 'admin' | 'agent' | 'user'
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Mock notifications - à remplacer avec l'API
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nouveau ticket créé',
        message: 'Un nouveau ticket a été ajouté à la file A avec priorité haute',
        time: 'Il y a 2 min',
        read: false,
        type: 'info',
        category: 'ticket',
        actionUrl: '/queues'
      },
      {
        id: '2',
        title: 'Ticket prioritaire en attente',
        message: 'Le ticket #123 nécessite une attention immédiate - client en attente depuis 15 minutes',
        time: 'Il y a 5 min',
        read: false,
        type: 'warning',
        category: 'queue',
        actionUrl: '/queues/priority'
      },
      {
        id: '3',
        title: 'File traitée avec succès',
        message: 'La file B a été complètement traitée. 45 tickets ont été servis.',
        time: 'Il y a 10 min',
        read: true,
        type: 'success',
        category: 'queue'
      },
      {
        id: '4',
        title: 'Erreur de connexion',
        message: 'Une tentative de connexion non autorisée a été détectée sur votre compte',
        time: 'Il y a 1 heure',
        read: false,
        type: 'error',
        category: 'system'
      },
      {
        id: '5',
        title: 'Mise à jour du système',
        message: 'Le système sera mis à jour demain à 2h00. Prévoyez une interruption de 15 minutes.',
        time: 'Il y a 2 heures',
        read: true,
        type: 'info',
        category: 'system'
      },
      {
        id: '6',
        title: 'Nouvel agent ajouté',
        message: 'Jean Dupont a été ajouté comme agent à votre établissement',
        time: 'Il y a 3 heures',
        read: true,
        type: 'success',
        category: 'user'
      },
      {
        id: '7',
        title: 'Temps d\'attente élevé',
        message: 'Le temps d\'attente moyen dans la file C dépasse 20 minutes',
        time: 'Il y a 4 heures',
        read: false,
        type: 'warning',
        category: 'queue'
      }
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesReadStatus = 
      filter === 'all' || 
      (filter === 'unread' && !notification.read) || 
      (filter === 'read' && notification.read);
    
    const matchesType = 
      typeFilter === 'all' || 
      notification.type === typeFilter;
    
    return matchesReadStatus && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreatingNotification(true);
    
    try {
      // Simuler API call - remplacer avec vrai appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const notification: Notification = {
        id: Date.now().toString(),
        title: newNotification.title,
        message: newNotification.message,
        time: 'À l\'instant',
        read: false,
        type: newNotification.type,
        category: newNotification.category
      };

      setNotifications(prev => [notification, ...prev]);
      
      // Reset form
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        category: 'system',
        targetRole: 'all'
      });
      setShowCreateForm(false);
      
      alert('Notification créée avec succès!');
    } catch (error) {
      console.error('Erreur création notification:', error);
      alert('Erreur lors de la création de la notification');
    } finally {
      setCreatingNotification(false);
    }
  };

  const handleCancelCreate = () => {
    setNewNotification({
      title: '',
      message: '',
      type: 'info',
      category: 'system',
      targetRole: 'all'
    });
    setShowCreateForm(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'ticket':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'system':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'queue':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'user':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Veuillez vous connecter pour accéder à vos notifications.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Gérez vos notifications et restez informé des activités importantes
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-2 mb-6">
          {isAdmin && (
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button 
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Créer une notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Send className="h-5 w-5" />
                    Créer une nouvelle notification
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={newNotification.title}
                        onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Titre de la notification"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              Information
                            </div>
                          </SelectItem>
                          <SelectItem value="success">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Succès
                            </div>
                          </SelectItem>
                          <SelectItem value="warning">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              Alerte
                            </div>
                          </SelectItem>
                          <SelectItem value="error">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Erreur
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Contenu détaillé de la notification"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={newNotification.category} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">Système</SelectItem>
                          <SelectItem value="ticket">Tickets</SelectItem>
                          <SelectItem value="queue">Files d'attente</SelectItem>
                          <SelectItem value="user">Utilisateurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="targetRole">Destinataires</Label>
                      <Select value={newNotification.targetRole} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, targetRole: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les utilisateurs</SelectItem>
                          <SelectItem value="admin">Administrateurs</SelectItem>
                          <SelectItem value="agent">Agents</SelectItem>
                          <SelectItem value="user">Utilisateurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateNotification}
                      disabled={creatingNotification || !newNotification.title.trim() || !newNotification.message.trim()}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {creatingNotification ? 'Création...' : 'Envoyer la notification'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelCreate}
                      disabled={creatingNotification}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Tout effacer
          </Button>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtrer:</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Tout ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Non lues ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('read')}
                >
                  Lues ({notifications.length - unreadCount})
                </Button>
              </div>

              <div className="h-6 w-px bg-border" />

              <div className="flex gap-2">
                <Button
                  variant={typeFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                >
                  Tous types
                </Button>
                <Button
                  variant={typeFilter === 'info' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('info')}
                  className="flex items-center gap-1"
                >
                  <Info className="h-3 w-3" />
                  Info
                </Button>
                <Button
                  variant={typeFilter === 'success' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('success')}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Succès
                </Button>
                <Button
                  variant={typeFilter === 'warning' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('warning')}
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Alerte
                </Button>
                <Button
                  variant={typeFilter === 'error' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('error')}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Erreur
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des notifications */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === 'unread' ? 'Aucune notification non lue' : 
               filter === 'read' ? 'Aucune notification lue' : 
               'Aucune notification'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'Toutes vos notifications ont été lues' :
               filter === 'read' ? "Vous n'avez pas encore lu de notifications" :
               "Vous n'avez pas encore reçu de notifications"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={cn(
                "transition-all duration-200 hover:shadow-md",
                !notification.read && "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icône de notification */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    notification.type === 'info' && "bg-blue-100 dark:bg-blue-900/30",
                    notification.type === 'success' && "bg-green-100 dark:bg-green-900/30",
                    notification.type === 'warning' && "bg-orange-100 dark:bg-orange-900/30",
                    notification.type === 'error' && "bg-red-100 dark:bg-red-900/30"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold text-foreground mb-1",
                          !notification.read && "font-bold"
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getCategoryColor(notification.category))}
                          >
                            {notification.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 hover:bg-accent"
                            title="Marquer comme lu"
                          >
                            <Check className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 hover:bg-destructive/10"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>

                    {/* Action button if applicable */}
                    {notification.actionUrl && (
                      <div className="mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            // Navigation vers l'URL d'action
                            window.location.href = notification.actionUrl;
                          }}
                        >
                          Voir les détails
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
