export default function Settings(){
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="text-lg font-semibold text-foreground mb-4">Paramètres</div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">API:</span>
          <code className="bg-muted px-2 py-1 rounded text-foreground">{import.meta.env.VITE_API_BASE_URL}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pusher Host:</span>
          <code className="bg-muted px-2 py-1 rounded text-foreground">{import.meta.env.VITE_PUSHER_HOST}</code>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pusher Port:</span>
          <code className="bg-muted px-2 py-1 rounded text-foreground">{import.meta.env.VITE_PUSHER_PORT}</code>
        </div>
      </div>
    </div>
  )
}
