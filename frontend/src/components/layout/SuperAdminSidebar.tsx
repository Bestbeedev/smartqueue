import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Settings,
  Shield,
  Crown,
  BarChart3,
  Database,
  Server,
  FileText,
  Bell,
  Lock,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SuperAdminSidebar({ isOpen, onToggle }: SuperAdminSidebarProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble'
    },
    {
      title: 'Monitoring',
      href: '/dashboard/saas/monitoring',
      icon: BarChart3,
      description: 'Statistiques système'
    },
    {
      title: 'Établissements',
      href: '/dashboard/saas/establishments',
      icon: Building2,
      description: 'Gestion des clients'
    },
    {
      title: 'Abonnements',
      href: '/dashboard/saas/subscriptions',
      icon: CreditCard,
      description: 'Plans et facturation'
    },
    {
      title: 'Paramètres SaaS',
      href: '/dashboard/saas/settings',
      icon: Settings,
      description: 'Configuration plateforme'
    },
    {
      title: 'Profil Admin',
      href: '/dashboard/profile',
      icon: User,
      description: 'Mon profil super admin'
    }
  ];

  const systemItems = [
    {
      title: 'Sécurité',
      href: '/dashboard/security',
      icon: Shield,
      description: 'Sécurité système'
    },
    {
      title: 'Base de données',
      href: '/dashboard/database',
      icon: Database,
      description: 'Gestion BDD'
    },
    {
      title: 'Serveurs',
      href: '/dashboard/servers',
      icon: Server,
      description: 'Infrastructure'
    },
    {
      title: 'Logs',
      href: '/dashboard/logs',
      icon: FileText,
      description: 'Journaux système'
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-background border-r border-border z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 overflow-y-auto
      `}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">SmartQueue</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  Super Admin
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6">
          {/* Menu principal */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Principal
            </h3>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                    onClick={() => {
                      // Fermer le sidebar sur mobile après navigation
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs opacity-70 truncate">{item.description}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Système */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Système
            </h3>
            <div className="space-y-1">
              {systemItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs opacity-70 truncate">{item.description}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Déconnexion
              </Button>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="text-xs text-muted-foreground text-center">
            <p>Version 1.0.0-MVP</p>
            <p>© 2026 SmartQueue</p>
          </div>
        </div>
      </div>
    </>
  );
}
