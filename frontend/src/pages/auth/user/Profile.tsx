import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/store';
import { logout, updateProfile } from '@/store/authSlice';
import { api } from '@/api/axios';
import { toast } from 'sonner';

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    avatar: '',
  });
  const [pwData, setPwData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [isAuthenticated, user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await dispatch(updateProfile({
        name: profileData.name,
        phone: profileData.phone || null,
        avatar: profileData.avatar || null,
      })).unwrap();
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde du profil.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwData.password !== pwData.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (pwData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/api/me/change-password', pwData);
      setPwData({ current_password: '', password: '', password_confirmation: '' });
      toast.success('Mot de passe modifié avec succès.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors du changement de mot de passe.';
      toast.error(msg);
    } finally {
      setPwLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
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
    <div className="container mx-auto px-4 py-8">
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

              {/* Champs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nom complet</label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Rôle</label>
                  <Input value={user?.role || ''} disabled={true} className="bg-muted" />
                </div>
              </div>
            </div>
          </div>

          {/* Changement de mot de passe */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Changement de mot de passe</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mot de passe actuel</label>
                <Input
                  type="password"
                  value={pwData.current_password}
                  onChange={(e) => setPwData({ ...pwData, current_password: e.target.value })}
                  placeholder="Mot de passe actuel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nouveau mot de passe</label>
                <Input
                  type="password"
                  value={pwData.password}
                  onChange={(e) => setPwData({ ...pwData, password: e.target.value })}
                  placeholder="8 caractères minimum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirmer</label>
                <Input
                  type="password"
                  value={pwData.password_confirmation}
                  onChange={(e) => setPwData({ ...pwData, password_confirmation: e.target.value })}
                  placeholder="Répétez le mot de passe"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleChangePassword} disabled={pwLoading || !pwData.current_password || !pwData.password}>
                {pwLoading ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
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
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">

          {/* Mon activité */}
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
            </div>
          </div>

          {/* Système */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Système</h2>
            <div className="space-y-3">
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                Se déconnecter
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Version 1.0.0-MVP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
