/**
 * ProtectedRoute - Composant de protection des routes
 * Vérifie l'authentification avant d'accéder aux routes protégées
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
  requiredPermission?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = [], 
  requiredPermission 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole, hasPermission } = useAuth()
  const location = useLocation()
  const authState = useAppSelector((state) => state.auth)

  // Si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Guard onboarding admin: force establishment setup before accessing the app
  const isSetupPath = location.pathname === '/setup-establishment' || location.pathname === '/setup-establishment/'
  if (user?.role === 'admin' && !user?.establishment_id && !isSetupPath) {
    return <Navigate to="/setup-establishment" replace />
  }

  // Si un rôle spécifique est requis
  if (requiredRole.length > 0 && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Accès non autorisé</h1>
          <p className="text-muted-foreground mb-8">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  // Si une permission spécifique est requise
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Permission requise</h1>
          <p className="text-muted-foreground mb-8">
            Vous n'avez pas la permission requise pour accéder à cette ressource.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  // Si tout est bon, afficher les enfants
  return <>{children}</>
}
