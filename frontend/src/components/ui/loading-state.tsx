import React from 'react'
import { RefreshCw } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({ 
  message = 'Chargement...', 
  size = 'md',
  className = ''
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 text-sm mb-2',
    md: 'h-8 w-8 text-lg mb-4',
    lg: 'h-12 w-12 text-xl mb-6'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <RefreshCw className={`animate-spin mx-auto text-muted-foreground ${sizeClasses[size]}`} />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ 
  message = 'Erreur lors du chargement des données', 
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  message = 'Aucune donnée disponible', 
  icon,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">
          {icon || '📊'}
        </div>
        <p className="text-muted-foreground mb-4">{message}</p>
        {action}
      </div>
    </div>
  )
}
