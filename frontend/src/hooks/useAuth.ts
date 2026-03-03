/**
 * Hook d'authentification
 * Gestion centralisée de l'état d'authentification et des permissions
 */
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { User } from '@/store/authSlice'

export function useAuth() {
  const auth = useSelector((state: RootState) => state.auth)
  
  const hasRole = (roles: string[]) => {
    return auth.user ? roles.includes(auth.user.role) : false
  }

  const hasPermission = (permission: string) => {
    // Logique de permissions basée sur le rôle
    if (!auth.user) return false
    
    const permissions = {
      admin: ['*'], // Admin a toutes les permissions
      agent: ['queue:read', 'queue:update', 'ticket:read', 'ticket:update'],
      user: ['queue:read', 'ticket:read']
    }
    
    return permissions[auth.user.role]?.includes(permission) || false
  }

  return {
    ...auth,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.loading,
    hasRole,
    hasPermission,
    isAdmin: auth.user?.role === 'admin',
    isAgent: auth.user?.role === 'agent',
    isUser: auth.user?.role === 'user'
  }
}
