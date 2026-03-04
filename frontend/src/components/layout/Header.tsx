/**
 * HeaderNew - Version moderne avec notifications et profil améliorés
 * Barre supérieure affichant l'utilisateur connecté, les notifications et le thème
 */
import { useState, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/authSlice'
import { 
  Bell, 
  LogOut, 
  Menu, 
  Search, 
  Settings, 
  User,
  Moon,
  Sun,
  ChevronDown,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

type HeaderProps = {
  onMenuToggle?: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

export default function HeaderNew({ onMenuToggle }: HeaderProps) {
  const { user } = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Mock notifications - à remplacer avec les vraies données
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nouveau ticket',
      message: 'Un nouveau ticket a été ajouté à la file A',
      time: 'Il y a 2 min',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Ticket prioritaire',
      message: 'Ticket #123 nécessite une attention immédiate',
      time: 'Il y a 5 min',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'File terminée',
      message: 'La file B a été traitée avec succès',
      time: 'Il y a 10 min',
      read: true,
      type: 'success'
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length
  const navigate= useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  }

  // Fermer le dropdown des notifications en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 transition-all duration-300 ",
      "bg-background border-border"
    )}>
      {/* Section gauche - Menu mobile et recherche */}
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="md:hidden h-9 w-9 hover:bg-accent"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
        
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-9 pl-10 pr-4 text-sm rounded-xl transition-all duration-300",
              "bg-muted border border-border",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary",
              "placeholder:text-muted-foreground"
            )}
            placeholder="Rechercher des tickets, files..."
          />
        </div>
      </div>

      {/* Section droite - Notifications, thème et profil */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "relative h-9 w-9 transition-all duration-300",
              "hover:bg-accent hover:scale-110"
            )}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse shadow-lg"
              >
                {unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Dropdown notifications */}
          {notificationsOpen && (
            <div className={cn(
              "absolute right-0 top-full mt-2 w-80 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden transition-all duration-300",
              "bg-background border-border"
            )}>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsOpen(false)}
                  className="h-6 w-6 hover:bg-accent"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Aucune notification
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-accent transition-colors cursor-pointer",
                          !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                            notification.type === 'error' && "bg-red-500",
                            notification.type === 'warning' && "bg-orange-500",
                            notification.type === 'success' && "bg-green-500",
                            notification.type === 'info' && "bg-blue-500"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" className="w-full hover:bg-accent">
                  Voir toutes les notifications
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Toggle thème */}
        <ThemeToggle />

        {/* Profil utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "relative h-9 px-2 transition-all duration-300",
                "hover:bg-accent hover:scale-105"
              )}
            >
              <Avatar className="h-8 w-8 ring-2 ring-blue-500/20" src={user.avatar}>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium flex items-center justify-center">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block ml-3 text-left">
                <p className="text-sm font-medium ">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
              <ChevronDown className="hidden md:block ml-2 h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className={cn(
            "w-56 rounded-xl shadow-2xl transition-all duration-300",
            "bg-background border-border"
          )}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="hover:bg-accent">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Mon profil</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="hover:bg-accent">
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Paramètres</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive hover:bg-accent focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
