import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Activity,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Menu,
  Settings2,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/mapa", label: "Mapa general", icon: Map },
  { href: "/admin/clientes", label: "Clientes", icon: MapPinned },
  { href: "/admin/actividad", label: "Actividad", icon: Activity },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings2 },
];

type Props = {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** El contenido ocupa toda la altura disponible (mapa). */
  fill?: boolean;
};

export function AdminShell({ children, title, description, actions, fill }: Props) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (user?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join("");

  const nav = (
    <nav className="space-y-0.5">
      {NAV.map(item => {
        const active =
          item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}>
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <div className="grid place-items-center h-9 w-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <MapPinned className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sidebar-foreground leading-tight truncate">
            MapaClientes
          </p>
          <p className="text-[11px] text-sidebar-foreground/55">Panel de administración</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden text-sidebar-foreground"
          onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">{nav}</div>

      <div className="px-3 pb-3 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors">
          <Smartphone className="h-4 w-4" />
          Vista de campo
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full rounded-lg px-2 py-2 hover:bg-sidebar-accent/60 transition-colors text-left">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                <AvatarFallback className="text-[11px] font-semibold bg-sidebar-accent text-sidebar-accent-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-sidebar-foreground/55 truncate">
                  @{user?.username}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Sesión activa
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/perfil">Mi perfil y contraseña</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh flex bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-lg">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-lg leading-tight truncate">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              )}
            </div>
            {actions}
          </div>
        </header>

        <main className={cn("flex-1 min-h-0", fill ? "relative" : "px-4 lg:px-8 py-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
