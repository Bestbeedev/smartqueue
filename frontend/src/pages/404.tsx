export default function NotFound(){
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground selection:bg-primary/30">
          {/* Optionnel : Un cercle décoratif flou en arrière-plan pour la profondeur */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-md w-full px-6 text-center">
            {/* L'identifiant d'erreur avec un style imposant */}
            <h1 className="text-9xl font-black tracking-tighter text-blue-500 leading-none mb-12">
              404
            </h1>

            <div className="relative -mt-12">
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                Oups ! Page perdue.
              </h2>
              <p className="text-muted-foreground text-lg mb-5 balance">
                Désolé, la page que vous recherchez semble avoir déménagé ou n'a
                jamais existé.
              </p>

              {/* Bouton stylisé avec transition */}
              <a
                href="/"
                className="inline-flex items-center justify-center h-12 px-8 font-medium tracking-wide text-primary-foreground transition duration-200 rounded-full bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none focus:ring-offset-background active:scale-95"
              >
                Retour à la navigation
              </a>
            </div>
          </div>
        </div>
    )
}