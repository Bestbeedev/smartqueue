import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { api } from '@/api/axios';

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Charger les données du profil
  useEffect(() => {
    if (isAuthenticated && user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [isAuthenticated, user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone || null,
        avatar: profileData.avatar || null
      };

      // Ajouter le mot de passe seulement si fourni
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          alert('Les mots de passe ne correspondent pas');
          return;
        }
        updateData.password = profileData.newPassword;
        updateData.current_password = profileData.currentPassword;
      }

      await api.put('/api/me', updateData);
      setIsEditing(false);
      // Recharger les données utilisateur
      window.location.reload();
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      alert('Erreur lors de la sauvegarde du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Réinitialiser avec les données originales
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Veuillez vous connecter pour accéder à votre profil.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mon profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Informations personnelles */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Informations personnelles</h2>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {profileData.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{profileData.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
                  {isEditing && (
                    <div className="mt-2">
                      <Input
                        placeholder="URL de l'avatar"
                        value={profileData.avatar}
                        onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                        className="w-full max-w-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom complet
                  </label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Téléphone
                  </label>
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rôle
                  </label>
                  <Input
                    value={user?.role || ''}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Changement de mot de passe */}
              {isEditing && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Changement de mot de passe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Mot de passe actuel
                      </label>
                      <Input
                        type="password"
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                        placeholder="Laisser vide si inchangé"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nouveau mot de passe
                      </label>
                      <Input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        placeholder="Laisser vide si inchangé"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirmer le mot de passe
                      </label>
                      <Input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        placeholder="Laisser vide si inchangé"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Préférences de notification */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Préférences de notification</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications par email</p>
                  <p className="text-sm text-muted-foreground">Recevoir les notifications importantes par email</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications push</p>
                  <p className="text-sm text-muted-foreground">Recevoir les notifications sur votre appareil</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications SMS</p>
                  <p className="text-sm text-muted-foreground">Recevoir les alertes par SMS</p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Newsletter</p>
                  <p className="text-sm text-muted-foreground">Recevoir les actualités et mises à jour</p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Sécurité</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Authentification à deux facteurs</p>
                  <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire</p>
                </div>
                <Button variant="outline">Configurer</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Sessions actives</p>
                  <p className="text-sm text-muted-foreground">Gérez vos sessions de connexion</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Journal d'activité</p>
                  <p className="text-sm text-muted-foreground">Consultez l'historique de vos activités</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          
          {/* Statistiques du compte */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Mon activité</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Membre depuis</p>
                <p className="text-2xl font-bold text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets traités</p>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps de réponse moyen</p>
                <p className="text-2xl font-bold text-foreground">N/A</p>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Voir l'historique complet
            </Button>
          </div>

          {/* Actions rapides */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                📥 Exporter mes données
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🔑 Réinitialiser le mot de passe
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📱 Configurer le mobile
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🎨 Personnaliser l'interface
              </Button>
            </div>
          </div>

          {/* Support */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Aide et support</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Centre d'aide</span>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Contacter le support</span>
                <Button variant="outline" size="sm">Contacter</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Signaler un problème</span>
                <Button variant="outline" size="sm">Signaler</Button>
              </div>
            </div>
          </div>

          {/* Actions système */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Système</h2>
            <div className="space-y-3">
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                Se déconnecter
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Version 1.0.0-MVP<br />
                Dernière mise à jour: 4 Mars 2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
