import { useAuth } from "@/_core/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { MapPinned } from "lucide-react";
import type { ComponentType } from "react";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminClients from "./pages/admin/AdminClients";
import AdminMap from "./pages/admin/AdminMap";
import AdminNotes from "./pages/admin/AdminNotes";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import FieldMap from "./pages/FieldMap";
import Login from "./pages/Login";
import NotesBoard from "./pages/NotesBoard";
import Profile from "./pages/Profile";
import SiteDetail from "./pages/SiteDetail";
import SiteList from "./pages/SiteList";

function Splash() {
  return (
    <div className="min-h-dvh grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="grid place-items-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground animate-pulse">
          <MapPinned className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando MapaClientes…</p>
      </div>
    </div>
  );
}

/** Ruta que exige sesión activa; opcionalmente rol de administrador. */
function Guard({
  component: Component,
  adminOnly,
}: {
  component: ComponentType;
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Redirect to="/acceso" />;
  if (adminOnly && !isAdmin) return <Redirect to="/" />;
  return <Component />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Redirect to="/" />;
  return <Login />;
}

function Router() {
  return (
    <Switch>
      <Route path="/acceso" component={LoginRoute} />

      {/* Vendedor de campo */}
      <Route path="/">{() => <Guard component={FieldMap} />}</Route>
      <Route path="/sitios">{() => <Guard component={SiteList} />}</Route>
      <Route path="/sitios/:id">{() => <Guard component={SiteDetail} />}</Route>
      <Route path="/notas">{() => <Guard component={NotesBoard} />}</Route>
      <Route path="/perfil">{() => <Guard component={Profile} />}</Route>

      {/* Administración */}
      <Route path="/admin">{() => <Guard component={AdminOverview} adminOnly />}</Route>
      <Route path="/admin/mapa">{() => <Guard component={AdminMap} adminOnly />}</Route>
      <Route path="/admin/clientes">{() => <Guard component={AdminClients} adminOnly />}</Route>
      <Route path="/admin/clientes/:id">
        {() => <Guard component={AdminClientDetail} adminOnly />}
      </Route>
      <Route path="/admin/notas">{() => <Guard component={AdminNotes} adminOnly />}</Route>
      <Route path="/admin/actividad">{() => <Guard component={AdminActivity} adminOnly />}</Route>
      <Route path="/admin/usuarios">{() => <Guard component={AdminUsers} adminOnly />}</Route>
      <Route path="/admin/configuracion">
        {() => <Guard component={AdminSettings} adminOnly />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
