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
            borderRadius: '1rem',
            zIndex: 9999,
          },
          className: 'z-[9999]',
        }}
        containerStyle={{
          zIndex: 9999,
        }}
        expand={true}
        richColors
      />
    </>
  )
}

export default App
