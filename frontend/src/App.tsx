/**
 * App - Composant principal simplifié
 * Le routage est maintenant géré par le composant Router
 */
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          closeButton: true,
          style: {
            // background: 'hsl(var(--primary))',
            // color: 'hsl(var(--primary-foreground))',
            // border: '1px solid hsl(var(--border))',
            borderRadius: '1rem',
          },
        }}
      />
    </>
  )
}

export default App
