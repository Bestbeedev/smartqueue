/**
 * Sidebar - Version moderne avec toggle icon/full mode et support du thème
 * Navigation latérale avec liens conditionnés par le rôle (admin/agent).
 */
import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store";
import {
  LayoutDashboard,
  Activity,
  Users,
  Building2,
  Ticket,
  Settings as SettingsIcon,
  ListOrdered,
  BadgeAlert,
  Ban,
  BarChart,
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon, Server, CreditCard,
  ArrowBigRight,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LinkItemProps {
  to: string;
  icon: any;
  label: string;
  isCollapsed: boolean;
}

const LinkItem = ({
  to,
  icon: Icon,
  label,
  isCollapsed,
}: LinkItemProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (isCollapsed) {
    // Mode collapsed : utiliser un div comme les autres menus
    const isActive = location.pathname === to;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={() => navigate(to)}
              className={cn(
                "relative group flex items-center justify-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar cursor-pointer hover:scale-105",
                "h-10 w-10 mx-auto p-0",
                isActive && location.pathname === to
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
                  : "text-muted-foreground",
              )}
            >
              {isActive && location.pathname === to && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
              )}
              <Icon
                size={18}
                className={cn(
                  "transition-all duration-300 flex-shrink-0",
                  isActive && location.pathname === to
                    ? "text-white"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-background border-border">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Mode étendu : utiliser NavLink normal
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar",
          "hover:scale-105",
          "px-3 py-2.5",
          isActive && location.pathname === to
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
            : "text-muted-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && location.pathname === to && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
          )}
          <Icon
            size={18}
            className={cn(
              "transition-all duration-300 flex-shrink-0",
              isActive && location.pathname === to
                ? "text-white"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <span
            className={cn(
              "truncate font-medium transition-all duration-300",
              isActive && location.pathname === to ? "text-white" : "text-foreground",
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};

const SubmenuItem = ({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: any;
  label: string;
}) => {
  const location = useLocation();

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar",
          "hover:scale-105",
          isActive && location.pathname === to
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white  shadow-lg shadow-blue-500/25 border-blue-500"
            : "text-muted-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && location.pathname === to && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1  bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
          )}
          <Icon
            size={16}
            className={cn(
              "transition-all duration-300 ",
              isActive && location.pathname === to
                ? "text-white"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <span
            className={cn(
              "truncate font-medium transition-all duration-300 ",
              isActive && location.pathname === to ? "text-white" : "text-foreground",
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role;
  const isOnboardingLocked = role === 'admin' && !user?.establishment_id;
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = (menuPath: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuPath)
        ? prev.filter((item) => item !== menuPath)
        : [...prev, menuPath],
    );
  };

  // Auto-ouvrir le menu des queues si on est sur une page de sous-menu
  React.useEffect(() => {
    if (
      location.pathname.startsWith("/dashboard/queues") &&
      location.pathname !== "/dashboard/queues" &&
      !expandedMenus.includes("/dashboard/queues")
    ) {
      setExpandedMenus(["/dashboard/queues"]);
    }
  }, [location.pathname, expandedMenus]);

  const navigationItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: role === "super_admin" ? "Dashboard SaaS" : role === "agent" ? "Espace Agent" : "Tableau de bord",
      roles: ["all"],
    },
    {
      to: "/dashboard/queues",
      icon: ListOrdered,
      label: "Files d'attente",
      roles: ["agent", "admin"],
      submenu: [
        { to: "/dashboard/queues/called", icon: Activity, label: "Tickets appelés" },
        { to: "/dashboard/queues/absent", icon: Ban, label: "Absents" },
        { to: "/dashboard/queues/priority", icon: BadgeAlert, label: "Prioritaires" },
      ],
    },
    { to: "/dashboard/agents", icon: Users, label: "Agents", roles: ["admin"] },
    { to: "/dashboard/services", icon: Ticket, label: "Services", roles: ["admin"] },
    {
      to: "/dashboard/establishments",
      icon: Building2,
      label: "Établissements",
      roles: ["admin"],
    },
    { to: "/dashboard/stats", icon: BarChart, label: "Statistiques", roles: ["admin"] },
    {
      to: "/dashboard/settings",
      icon: SettingsIcon,
      label: role === "super_admin" ? "Config SaaS" : "Paramètres",
      roles: ["all"],
    },
  ];

  const filteredItems = navigationItems.filter(
    (item) => item.roles.includes("all") || item.roles.includes(role as string),
  );

  const searchableRoutes = React.useMemo(() => {
    const routes: { to: string; label: string }[] = [];
    for (const item of filteredItems) {
      routes.push({ to: item.to, label: item.label });
      if ('submenu' in item && Array.isArray((item as any).submenu)) {
        for (const sub of (item as any).submenu) {
          routes.push({ to: sub.to, label: sub.label });
        }
      }
    }
    return routes;
  }, [filteredItems]);

  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as { to: string; label: string }[];
    return searchableRoutes
      .filter((r) => r.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, searchableRoutes]);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r transition-all duration-300 ease-in-out",
        "bg-background border-border",
        isCollapsed ? "w-16" : "w-64",
      )}
      data-sidebar-width={isCollapsed ? "collapsed" : "expanded"}
    >
      {isOnboardingLocked && (
        <div className="absolute inset-0 z-50 cursor-not-allowed" aria-hidden="true" />
      )}
      {/* Header avec logo et toggle */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
              SQ
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              SmartQueue
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform">
                    SQ
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-background border-border">
                  <p>SmartQueue</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                      "h-6 w-6 rounded-lg transition-all duration-300",
                      "hover:bg-accent hover:scale-110",
                    )}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-background border-border">
                  <p>Développer le menu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {!isCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all duration-300",
                    "hover:bg-accent hover:scale-110",
                  )}
                >
                  <ChevronLeft size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-background border-border">
                <p>Réduire le menu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Barre de recherche (uniquement en mode étendu) */}
      {!isCollapsed && (
        <div className="px-3 py-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  navigate(searchResults[0].to);
                  setSearchQuery('');
                }
                if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 text-sm rounded-xl transition-all duration-300",
                "bg-muted border border-border",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary",
                "placeholder:text-muted-foreground",
              )}
            />

            {searchResults.length > 0 && (
              <div className={cn(
                "absolute left-0 right-0 top-full mt-2 rounded-xl border shadow-xl overflow-hidden z-50",
                "dark:bg-slate-900 bg-white border-border",
                "min-w-[230px] w-max max-w-md"
              )}>
                <div className="divide-y divide-border">
                  {searchResults.map((r) => (
                    <div
                      key={r.to}
                      className={cn(
                        "group relative flex items-center justify-between px-3 py-2 text-sm transition-colors",
                        "hover:bg-accent"
                      )}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => {
                          navigate(r.to);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-foreground truncate">{r.label}</span>
                          {/* <span className="text-xs text-muted-foreground truncate">{r.to}</span> */}
                        </div>
                      </button>
                      <Button
                        size="sm"
                        variant="default"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 px-2 text-xs"
                        onClick={() => {
                          navigate(r.to);
                          setSearchQuery('');
                        }}
                      >
                        Visiter <ArrowRight size="10"/>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-2">
          {/* Section principale */}
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Administration
            </div>
          )}
          {filteredItems.filter(item => 
            !['/dashboard/admin', '/dashboard/saas', '/dashboard/settings'].some(prefix => item.to.startsWith(prefix))
          ).map((item) => {
            const hasSubmenu = "submenu" in item && item.submenu;
            const isExpanded = expandedMenus.includes(item.to);

            // En mode collapsed, on exclut le menu queues de la navigation principale
            if (isCollapsed && hasSubmenu && item.to === "/dashboard/queues") {
              return null;
            }

            return (
              <div key={item.to}>
                {hasSubmenu ? (
                  /* Menu avec sous-menus */
                  <div>
                    {isCollapsed && item.to !== "/dashboard/queues" ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "relative group flex items-center justify-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar cursor-pointer hover:scale-105",
                                "h-10 w-10 mx-auto p-0",
                                location.pathname === item.to
                                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
                                  : "text-muted-foreground",
                              )}
                            >
                              {location.pathname === item.to && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                              )}
                              <item.icon
                                size={18}
                                className={cn(
                                  "transition-all duration-300 flex-shrink-0",
                                  location.pathname === item.to
                                    ? "text-white"
                                    : "text-muted-foreground group-hover:text-foreground",
                                )}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-background border-border">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "relative group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar",
                            "hover:scale-105",
                            isActive && location.pathname === item.to
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
                              : "text-muted-foreground",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && location.pathname === item.to && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                            )}
                            <item.icon
                              size={18}
                              className={cn(
                                "transition-all duration-300 ",
                                isActive && location.pathname === item.to
                                  ? "text-white"
                                  : "text-muted-foreground group-hover:text-foreground",
                              )}
                            />
                            {!isCollapsed && (
                              <>
                                <span
                                  className={cn(
                                    "truncate font-medium transition-all duration-300 flex-1",
                                    isActive && location.pathname === item.to
                                      ? "text-white"
                                      : "text-foreground",
                                  )}
                                >
                                  {item.label}
                                </span>
                                <div
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!isCollapsed) toggleMenu(item.to);
                                  }}
                                  className="p-1 rounded hover:bg-white/10 transition-colors"
                                >
                                  <ChevronDown
                                    size={16}
                                    className={cn(
                                      "transition-transform duration-300",
                                      isExpanded ? "rotate-180" : "",
                                      isActive && location.pathname === item.to
                                        ? "text-white"
                                        : "text-muted-foreground",
                                    )}
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </NavLink>
                    )}

                    {/* Sous-menus */}
                    {!isCollapsed && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((submenuItem) => (
                          <SubmenuItem
                            key={submenuItem.to}
                            to={submenuItem.to}
                            icon={submenuItem.icon}
                            label={submenuItem.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Menu normal sans sous-menus */
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "relative group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar",
                        "hover:scale-105",
                        isActive && location.pathname === item.to
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
                          : "text-muted-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && location.pathname === item.to && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                        )}
                        <item.icon
                          size={18}
                          className={cn(
                            "transition-all duration-300 ",
                            isActive && location.pathname === item.to
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        {!isCollapsed && (
                          <span
                            className={cn(
                              "truncate font-medium transition-all duration-300",
                              isActive && location.pathname === item.to ? "text-white" : "text-foreground",
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            );
          })}

          {/* Section Administration */}
          {filteredItems.some(item => item.to.startsWith('/dashboard/admin')) && !isCollapsed && (
            <div className="px-3 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Administration
            </div>
          )}
          {filteredItems.filter(item => item.to.startsWith('/dashboard/admin')).map((item) => {
            const hasSubmenu = "submenu" in item && item.submenu;
            const isExpanded = expandedMenus.includes(item.to);

            return (
              <div key={item.to}>
                {hasSubmenu ? (
                  <div>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "relative group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar",
                          "hover:scale-105",
                          isActive && location.pathname === item.to
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
                            : "text-muted-foreground",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && location.pathname === item.to && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                          )}
                          <item.icon
                            size={18}
                            className={cn(
                              "transition-all duration-300 ",
                              isActive && location.pathname === item.to
                                ? "text-white"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          />
                          {!isCollapsed && (
                            <>
                              <span
                                className={cn(
                                  "truncate font-medium transition-all duration-300 flex-1",
                                  isActive && location.pathname === item.to
                                    ? "text-white"
                                    : "text-foreground",
                                )}
                              >
                                {item.label}
                              </span>
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!isCollapsed) toggleMenu(item.to);
                                }}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                              >
                                <ChevronDown
                                  size={16}
                                  className={cn(
                                    "transition-transform duration-300",
                                    isExpanded ? "rotate-180" : "",
                                    isActive && location.pathname === item.to
                                      ? "text-white"
                                      : "text-muted-foreground",
                                  )}
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </NavLink>

                    {!isCollapsed && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((submenuItem) => (
                          <SubmenuItem
                            key={submenuItem.to}
                            to={submenuItem.to}
                            icon={submenuItem.icon}
                            label={submenuItem.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "relative group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out hover-sidebar",
                        "hover:scale-105",
                        isActive && location.pathname === item.to
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
                          : "text-muted-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && location.pathname === item.to && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                        )}
                        <item.icon
                          size={18}
                          className={cn(
                            "transition-all duration-300 ",
                            isActive && location.pathname === item.to
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        {!isCollapsed && (
                          <span
                            className={cn(
                              "truncate font-medium transition-all duration-300",
                              isActive && location.pathname === item.to ? "text-white" : "text-foreground",
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            );
          })}

          {/* Section SaaS */}
          {role === 'super_admin' && (
            <>
              {!isCollapsed && (
                <div className="px-3 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  SaaS
                </div>
              )}
              <LinkItem to="/dashboard/saas/monitoring" icon={Server} label="Monitoring" isCollapsed={isCollapsed} />
              <LinkItem to="/dashboard/saas/establishments" icon={Building2} label="Clients" isCollapsed={isCollapsed} />
              <LinkItem to="/dashboard/saas/subscriptions" icon={CreditCard} label="Abonnements" isCollapsed={isCollapsed} />
            </>
          )}
        </div>
      </nav>

      {/* Menu Tickets - uniquement en mode collapsed */}
      <div className={`p-3 border-t border-border ${isCollapsed ? "" : "hidden"} space-y-2`}>
        {isCollapsed && (role === "agent" || role === "admin") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10 rounded-xl transition-all duration-300",
                  "hover:bg-accent hover:scale-105",
                  location.pathname.startsWith("/dashboard/queues")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 border-blue-500"
                    : "text-muted-foreground",
                )}
              >
                <ListOrdered
                  size={18}
                  className={cn(
                    "transition-all w-fit duration-300",
                    location.pathname.startsWith("/dashboard/queues")
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              className="bg-card border-border text-card-foreground w-48 rounded-xl shadow-lg"
            >
              <DropdownMenuItem asChild>
                <NavLink
                  to="/dashboard/queues"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/dashboard/queues"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <ListOrdered size={16} />
                  <span>Files d'attente</span>
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink
                  to="/dashboard/queues/called"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/dashboard/queues/called"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Activity size={16} />
                  <span>Appelés</span>
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink
                  to="/dashboard/queues/absent"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/dashboard/queues/absent"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Ban size={16} />
                  <span>Absents</span>
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink
                  to="/dashboard/queues/priority"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/dashboard/queues/priority"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <BadgeAlert size={16} />
                  <span>Prioritaires</span>
                </NavLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {/* Section notifications et profil */}
      <div className="p-3 border-t border-border space-y-2">
        {/* Bouton notifications */}
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard/notifications')}
                  className={cn(
                    "w-full justify-center transition-all duration-300 rounded-xl",
                    "hover:bg-accent hover:scale-105",
                    "h-10 w-10 mx-auto",
                    location.pathname === "/dashboard/notifications"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 border-blue-500"
                      : "",
                  )}
                >
                  <Bell size={18} className={location.pathname === "/dashboard/notifications" ? "text-white" : "text-muted-foreground"} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-background border-border">
                <div className="flex items-center gap-2">
                  <span>Notifications</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="default"
            onClick={() => navigate('/dashboard/notifications')}
            className={cn(
              "w-full justify-center transition-all duration-300 rounded-xl",
              "hover:bg-accent hover:scale-105",
              location.pathname === "/dashboard/notifications"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25 border-blue-500"
                : "",
            )}
          >
            <Bell size={18} className={location.pathname === "/dashboard/notifications" ? "text-white" : "text-muted-foreground"} />
            <span className={location.pathname === "/dashboard/notifications" ? "text-white ml-3" : "text-foreground ml-3"}>Notifications</span>
            <div className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </Button>
        )}

        {/* Menu Settings */}
        <LinkItem to="/dashboard/settings" icon={SettingsIcon} label="Paramètres" isCollapsed={isCollapsed} />

        {/* Profil utilisateur */}
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:bg-accent hover:scale-105 cursor-pointer",
                  )}
                >
                  <Avatar
                    className="h-8 w-8 ring-2 ring-blue-500/20"
                    src={user?.avatar}
                  >
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-background border-border">
                <div className="space-y-1">
                  <p className="font-medium">{user?.name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || "email@exemple.com"}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-accent hover:scale-105",
            )}
          >
            <Avatar
              className="h-8 w-8 ring-2 ring-blue-500/20"
              src={user?.avatar}
            >
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 ">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || "Utilisateur"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || "email@exemple.com"}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
