/**
 * Sidebar - Version moderne avec toggle icon/full mode et support du thème
 * Navigation latérale avec liens conditionnés par le rôle (admin/agent).
 */
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  ChevronRight as ChevronRightIcon,
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
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white  shadow-lg shadow-blue-500/25 border-blue-500"
            : "text-muted-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1  bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
          )}
          <Icon
            size={16}
            className={cn(
              "transition-all duration-300 ",
              isActive
                ? "text-white"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <span
            className={cn(
              "truncate font-medium transition-all duration-300 ",
              isActive ? "text-white" : "text-foreground",
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
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role;
  const location = useLocation();

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
      location.pathname.startsWith("/queues") &&
      location.pathname !== "/queues" &&
      !expandedMenus.includes("/queues")
    ) {
      setExpandedMenus(["/queues"]);
    }
  }, [location.pathname, expandedMenus]);

  const navigationItems = [
    {
      to: "/",
      icon: LayoutDashboard,
      label: "Tableau de bord",
      roles: ["all"],
    },
    {
      to: "/queues",
      icon: ListOrdered,
      label: "Files d'attente",
      roles: ["agent", "admin"],
      submenu: [
        { to: "/queues/called", icon: Activity, label: "Tickets appelés" },
        { to: "/queues/absent", icon: Ban, label: "Absents" },
        { to: "/queues/priority", icon: BadgeAlert, label: "Prioritaires" },
      ],
    },
    { to: "/agents", icon: Users, label: "Agents", roles: ["admin"] },
    { to: "/services", icon: Ticket, label: "Services", roles: ["admin"] },
    {
      to: "/establishments",
      icon: Building2,
      label: "Établissements",
      roles: ["admin"],
    },
    { to: "/stats", icon: BarChart, label: "Statistiques", roles: ["admin"] },
    {
      to: "/settings",
      icon: SettingsIcon,
      label: "Paramètres",
      roles: ["all"],
    },
  ];

  const filteredItems = navigationItems.filter(
    (item) => item.roles.includes("all") || item.roles.includes(role as string),
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r transition-all duration-300 ease-in-out",
        "bg-background border-border",
        isCollapsed ? "w-16" : "w-64",
      )}
      data-sidebar-width={isCollapsed ? "collapsed" : "expanded"}
    >
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center text-white font-bold text-sm mx-auto">
            SQ
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "h-8 w-8 rounded-lg transition-all duration-300",
            "hover:bg-accent hover:scale-110",
          )}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
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
              className={cn(
                "w-full pl-10 pr-4 py-2.5 text-sm rounded-xl transition-all duration-300",
                "bg-muted border border-border",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary",
                "placeholder:text-muted-foreground",
              )}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const hasSubmenu = "submenu" in item && item.submenu;
            const isExpanded = expandedMenus.includes(item.to);

            // En mode collapsed, on exclut le menu queues de la navigation principale
            if (isCollapsed && hasSubmenu && item.to === "/queues") {
              return null;
            }

            return (
              <div key={item.to}>
                {hasSubmenu ? (
                  /* Menu avec sous-menus - uniquement en mode étendu */
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
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border shadow-lg shadow-blue-500/25 border-blue-500"
                          : "text-muted-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full" />
                        )}
                        <item.icon
                          size={18}
                          className={cn(
                            "transition-all duration-300 ",
                            isActive
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        {!isCollapsed && (
                          <span
                            className={cn(
                              "truncate font-medium transition-all duration-300",
                              isActive ? "text-white" : "text-foreground",
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
                  location.pathname.startsWith("/queues")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 border-blue-500"
                    : "text-muted-foreground",
                )}
              >
                <ListOrdered
                  size={18}
                  className={cn(
                    "transition-all w-fit duration-300",
                    location.pathname.startsWith("/queues")
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
                  to="/queues"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/queues"
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
                  to="/queues/called"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/queues/called"
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
                  to="/queues/absent"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/queues/absent"
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
                  to="/queues/priority"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                    location.pathname === "/queues/priority"
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
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          className={cn(
            "w-full justify-center transition-all duration-300 rounded-xl",
            "hover:bg-accent hover:scale-105",
            isCollapsed && "h-10 w-10 mx-auto",
          )}
        >
          <Bell size={18} className="text-muted-foreground" />
          {!isCollapsed && (
            <>
              <span className="ml-3 text-foreground">Notifications</span>
              <div className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </>
          )}
        </Button>

        {/* Profil utilisateur */}
        <div
          className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-accent hover:scale-105 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <Avatar
            className="h-8 w-8 ring-2 ring-blue-500/20"
            src={user?.avatar}
          >
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 ">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || "Utilisateur"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || "email@exemple.com"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
