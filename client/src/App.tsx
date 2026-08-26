import { useAuth } from "@/_core/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND_NAME } from "@/lib/brand";
import NotFound from "@/pages/NotFound";
import { MapPinned } from "lucide-react";
import React, { type ComponentType } from "react";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminClients from "./pages/admin/AdminClients";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import FieldMap from "./pages/FieldMap";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import SiteDetail from "./pages/SiteDetail";
import SiteList from "./pages/SiteList";
import TeamCalendar from "./pages/TeamCalendar";

function Splash() {
  return (
    <div className="min-h-dvh grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="grid place-items-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground animate-pulse">
          <MapPinned className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando {BRAND_NAME}…</p>
      </div>
    </div>
  );
}

/** Ruta que exige sesión activa; puede exigir administración o gestión comercial. */
function Guard({
  component: Component,
  adminOnly,
  managementOnly,
}: {
  component: ComponentType;
  adminOnly?: boolean;
  managementOnly?: boolean;
}) {
  const { user, loading, isAdmin, canManageAll } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Redirect to="/acceso" />;
  if (adminOnly && !isAdmin) return <Redirect to="/mapa" />;
  if (managementOnly && !canManageAll) return <Redirect to="/mapa" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/acceso" component={Login} />

      {/* El campo y los datos operativos requieren siempre una sesión válida. */}
      <Route path="/">{() => <Redirect to="/acceso" />}</Route>
      <Route path="/mapa">{() => <Guard component={FieldMap} />}</Route>
      <Route path="/sitios">{() => <Guard component={SiteList} />}</Route>
      <Route path="/sitios/:id">{() => <Guard component={SiteDetail} />}</Route>
      <Route path="/calendario">{() => <Guard component={TeamCalendar} />}</Route>
      <Route path="/notas">{() => <Redirect to="/sitios" />}</Route>
      <Route path="/perfil">{() => <Guard component={Profile} />}</Route>

      {/* Administración */}
      <Route path="/admin">{() => <Guard component={AdminOverview} managementOnly />}</Route>
      <Route path="/admin/mapa">{() => <Redirect to="/admin/actividad" />}</Route>
      <Route path="/admin/clientes">{() => <Guard component={AdminClients} managementOnly />}</Route>
      <Route path="/admin/clientes/:id">
        {() => <Guard component={AdminClientDetail} managementOnly />}
      </Route>
      <Route path="/admin/notas">{() => <Redirect to="/admin/clientes" />}</Route>
      <Route path="/admin/actividad">{() => <Guard component={AdminActivity} managementOnly />}</Route>
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
