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
import { LayoutDashboard, ListTree, LogOut, Map, MapPinned } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const TABS = [
  { href: "/", label: "Mapa", icon: Map },
  { href: "/sitios", label: "Clientes", icon: ListTree },
];

type FieldShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** El mapa ocupa toda la pantalla y no necesita padding ni scroll. */
  bleed?: boolean;
  action?: ReactNode;
};

export function FieldShell({ children, title, subtitle, bleed, action }: FieldShellProps) {
  const [location] = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const initials = (user?.name ?? user?.username ?? "?")
    .split(" ")
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-30 safe-top border-b border-border/70 bg-background/85 backdrop-blur-lg">
        <div className="flex items-center gap-3 px-4 pb-2.5 pt-2">
          <div className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground shrink-0">
            <MapPinned className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight truncate">
              {title ?? "MapaClientes PY"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {subtitle ?? user?.name ?? "Vendedor de campo"}
            </p>
          </div>
          {action}
          <DropdownMenu>
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
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel de administración
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
          </DropdownMenu>
        </div>
      </header>

      <main className={cn("flex-1 min-h-0", bleed ? "relative" : "px-4 py-4 pb-24")}>
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 safe-bottom border-t border-border/70 bg-background/92 backdrop-blur-lg">
        <div className="grid grid-cols-2 max-w-sm mx-auto px-2 pt-1.5">
          {TABS.map(tab => {
            const active =
              tab.href === "/" ? location === "/" : location.startsWith(tab.href);
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
