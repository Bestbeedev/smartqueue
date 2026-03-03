/**
 * DataTable
 * Tableau générique piloté par colonnes.
 * - columns: définition d'entêtes + fonction render optionnelle
 * - data: tableau d'objets à afficher
 */
import React from 'react'

type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
}

export default function DataTable<T extends { id?: number }>({ columns, data }: { columns: Column<T>[]; data: T[] }) {
  return (
    <div className="overflow-auto rounded-md border shadow-lg border-border ">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {data.map((row, i) => (
            <tr key={(row.id ?? i).toString()} className="hover-card transition-colors">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2 text-foreground">{c.render ? c.render(row) : String((row as any)[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
