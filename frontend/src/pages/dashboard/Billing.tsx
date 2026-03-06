import React from 'react'
import { Button } from '@/components/ui/button'

export default function Billing() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-card rounded-xl shadow-lg border max-w-6xl mx-auto border-border p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Facturation</h1>
        <p className="text-muted-foreground mb-6">
          La gestion de la facturation (paiements, factures, moyen de paiement, portail client) n'est pas encore
          disponible. Elle sera ajoutée dans une prochaine version.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => history.back()}>
            Retour
          </Button>
          <Button disabled>
            Bientôt disponible
          </Button>
        </div>
      </div>
    </div>
  )
}
