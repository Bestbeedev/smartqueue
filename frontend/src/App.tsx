/**
 * App - Composant principal simplifié
 * Le routage est maintenant géré par le composant Router
 */
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          },
        }}
      />
    </>
  )
}

export default App
