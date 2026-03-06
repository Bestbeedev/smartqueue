/**
 * DashboardRedirect
 * Page de redirection intelligente pour le dashboard.
 * - Vérifie si l'utilisateur est admin
 * - Si admin sans abonnement → Redirige vers subscription
 * - Si admin avec abonnement mais sans établissement → Redirige vers setup-establishment
 * - Si admin sans établissement (quel que soit l'abonnement) → Redirige vers setup-establishment
 * - Sinon redirige vers le dashboard normal
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { toast } from 'sonner'
import Dashboard from './Dashboard'

export default function DashboardRedirect() {
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }


    // Si l'utilisateur est admin
    if (user.role === 'admin') {
      // Si admin n'a pas d'établissement
      if (!user.establishment_id) {
        // Si admin n'a pas d'abonnement actif → Rediriger vers subscription d'abord
        if (!user.pending_subscription) {
          toast.info('Veuillez choisir un abonnement pour continuer')
          navigate('/subscription')
          return
        }
        
        // Si admin a un abonnement mais pas d'établissement → Rediriger vers setup
        toast.info('Veuillez configurer votre établissement pour continuer')
        navigate('/setup-establishment')
        return
      }
    }

    // Sinon, rediriger vers le dashboard normal
    console.log('Redirection vers dashboard normal')
    navigate('/')
  }, [user, navigate])

  return (
    <>
      
     <Dashboard/> 
    </>
  )
}
