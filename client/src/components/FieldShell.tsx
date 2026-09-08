import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HortimaxLogo } from "@/components/HortimaxLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";
import { CalendarDays, LayoutDashboard, ListTree, LogOut, Map } from "lucide-react";
import React, { type ReactNode } from "react";
import { Link, useLocation } from "wouter";

const TABS = [
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/sitios", label: "Clientes", icon: ListTree },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
];

type FieldShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** El mapa ocupa toda la pantalla y no necesita padding ni scroll. */
  bleed?: boolean;
  action?: ReactNode;
  /** Oculta el rótulo contextual bajo la marca, por ejemplo en el mapa público. */
  hideContext?: boolean;
  /** Solo en Android conectado: deja transparente la superficie bajo el mapa nativo. */
  nativeMap?: boolean;
};

export function FieldShell({ children, title, subtitle, bleed, action, hideContext, nativeMap }: FieldShellProps) {
  const [location] = useLocation();
  const { user, isAdmin, canManageAll, logout } = useAuth();

  const initials = (user?.name ?? user?.username ?? "?")
    .split(" ")
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={cn("min-h-dvh flex flex-col bg-background", nativeMap && "native-map-shell")}>
      <header className="sticky top-0 z-30 safe-top border-b border-border/70 bg-background/85 backdrop-blur-lg">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <HortimaxLogo className="h-8 max-w-[142px]" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px] leading-tight line-clamp-2">{BRAND_NAME}</p>
            {!hideContext && <p className="text-xs text-muted-foreground truncate">
              {title ?? subtitle ?? user?.name ?? "Vendedor de campo"}
            </p>}
          </div>
          {action}
          {user ? <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="text-xs font-semibold bg-secondary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">@{user?.username}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManageAll && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {isAdmin ? "Panel de administración" : "Gestión comercial"}
                  </Link>
                </DropdownMenuItem>
              )}
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
          </DropdownMenu> : null}
        </div>
        <div className="brand-spectrum" aria-hidden="true" />
      </header>

      <main className={cn("w-full min-w-0 max-w-full flex-1 min-h-0", bleed ? "relative" : "px-4 py-4 pb-24")}>
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 safe-bottom border-t border-border/70 bg-background/92 backdrop-blur-lg">
        <div className="grid grid-cols-3 max-w-md mx-auto px-2 pt-1.5">
          {TABS.map(tab => {
            const active =
              location.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors duration-150",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
