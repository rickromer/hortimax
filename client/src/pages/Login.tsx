import { Button } from "@/components/ui/button";
import { HortimaxLogo } from "@/components/HortimaxLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_NAME } from "@/lib/brand";
import { shouldShowInitialSetup } from "@/lib/loginScreenMode";
import { clearSavedMapView, requestGpsCenterAfterLogin } from "@/lib/mapSessionState";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getRememberedOfflineUser, isNetworkFailure, rememberOfflineCredential, setOfflineSession, verifyOfflineCredential } from "@/lib/offlineAuth";
import { prepareOfflineOperationalDataForUser } from "@/lib/offlineOperationalData";
import { isNativeAndroidApp, saveNativeSessionToken } from "@/lib/nativeSession";
import { TRPCClientError } from "@trpc/client";
import { ArrowLeft, KeyRound, Loader2, MapPinned, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Step = "usuario" | "clave" | "activar" | "setup";

export default function Login() {
  const { user: rememberedUser, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const setupQuery = trpc.auth.needsSetup.useQuery(undefined, { retry: false });
  const [step, setStep] = useState<Step>("usuario");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [adminName, setAdminName] = useState("");

  const needsSetup = setupQuery.data?.needsSetup ?? false;
  const showInitialSetup = shouldShowInitialSetup(needsSetup, window.location.search);

  useEffect(() => {
    if (!showInitialSetup && !authLoading && rememberedUser) window.location.replace("/acceso");
  }, [authLoading, rememberedUser, showInitialSetup]);

  const finish = () => {
    void utils.auth.me.invalidate().catch(() => undefined);
    void utils.auth.needsSetup.invalidate().catch(() => undefined);
    clearSavedMapView();
    requestGpsCenterAfterLogin();
    window.location.replace("/acceso");
  };

  const checkUser = trpc.auth.checkUsername.useMutation({
    onSuccess: data => {
      if (!data.exists) {
        toast.error("Ese usuario no existe o está inactivo");
        return;
      }
      setDisplayName(data.name);
      setStep(data.needsPassword ? "activar" : "clave");
    },
    onError: error => {
      const remembered = getRememberedOfflineUser(username);
      if (remembered) {
        setDisplayName(remembered.name);
        setStep("clave");
        toast.info("Sin señal: podés ingresar con la credencial de este dispositivo");
        return;
      }
      const status = error instanceof TRPCClientError ? error.data?.httpStatus : undefined;
      toast.error(status ? `No se pudo verificar el usuario (código ${status}).` : "No se pudo verificar el usuario. Revisá la conexión.");
    },
  });

  const completeOnlineLogin = async (response: any) => {
    const { mobileSessionToken, ...user } = response;
    // En Android la entrada no puede esperar la precarga offline: si una
    // consulta secundaria queda pendiente, el usuario debe ver de inmediato
    // la cartera conectada. La precarga continúa en segundo plano.
    if (isNativeAndroidApp()) {
      saveNativeSessionToken(mobileSessionToken);
      setOfflineSession(user);
      finish();
      void prepareOfflineOperationalDataForUser(user.id).catch(error => {
        console.warn("No se pudo preparar la copia offline", error);
      });
    } else {
      // La web conserva su flujo estable actual.
      await prepareOfflineOperationalDataForUser(user.id);
      setOfflineSession(user);
      finish();
    }
    // El verificador PBKDF2 permite el próximo ingreso sin señal, pero nunca
    // debe retener la navegación normal después de que el servidor validó la
    // contraseña. Se completa en segundo plano y no contiene datos de cartera.
    void rememberOfflineCredential(user, password).catch(error => {
      console.warn("No se pudo preparar la credencial offline", error);
    });
  };

  const login = trpc.auth.login.useMutation({
    onSuccess: user => {
      void completeOnlineLogin(user);
    },
    onError: error => {
      if (isNetworkFailure(error)) {
        void verifyOfflineCredential(username, password).then(user => {
          if (!user) {
            toast.error("Sin señal: usuario o contraseña no válidos en este dispositivo");
            return;
          }
          setOfflineSession(user);
          toast.success("Ingresaste sin señal. Los datos se sincronizarán al recuperar Internet.");
          void finish();
        });
        return;
      }
      toast.error(error.message);
    },
  });

  const activate = trpc.auth.activate.useMutation({
    onSuccess: response => {
      toast.success("Contraseña definida. ¡Bienvenido!");
      void completeOnlineLogin(response);
    },
    onError: error => toast.error(error.message),
  });

  const setupAdmin = trpc.auth.setupAdmin.useMutation({
    onSuccess: response => {
      toast.success("Cuenta de administrador creada");
      void completeOnlineLogin(response);
    },
    onError: error => toast.error(error.message),
  });

  const busy =
    checkUser.isPending || login.isPending || activate.isPending || setupAdmin.isPending;

  const reset = () => {
    setStep("usuario");
    setPassword("");
    setConfirm("");
    setCode("");
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 100% at 0% 0%, #1B5E43 0%, #123D2E 45%, #0C2A20 100%)",
        }}>
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff33 1px, transparent 1px), linear-gradient(90deg, #ffffff33 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative">
          <HortimaxLogo lightSurface className="h-10 max-w-[164px]" />
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-balance">
            Todo tu territorio, cliente por cliente.
          </h1>
        </div>

      </div>

      {/* Formulario */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 bg-background">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <HortimaxLogo lightSurface className="h-10 max-w-[164px] border border-border" />
            <div>
              <p className="font-bold text-lg tracking-tight">{BRAND_NAME}</p>
              <p className="text-xs text-muted-foreground">Gestión comercial en campo</p>
            </div>
          </div>

          {setupQuery.isLoading && window.location.search.includes("setup=1") ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : null}

          {showInitialSetup ? (
            <form
              className="space-y-5"
              onSubmit={event => {
                event.preventDefault();
                if (password.length < 6) {
                  toast.error("La contraseña debe tener al menos 6 caracteres");
                  return;
                }
                if (password !== confirm) {
                  toast.error("Las contraseñas no coinciden");
                  return;
                }
                setupAdmin.mutate({ name: adminName, username, password });
              }}>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Configuración inicial
                </div>
                <h2 className="text-2xl font-bold tracking-tight pt-2">
                  Creá la cuenta de administrador
                </h2>
                <p className="text-sm text-muted-foreground">
                  Es la primera vez que se abre el sistema. Esta cuenta va a poder crear
                  los usuarios de los vendedores.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-name">Nombre y apellido</Label>
                  <Input
                    id="admin-name"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-user">Usuario</Label>
                  <Input
                    id="admin-user"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    autoCapitalize="none"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-pass">Contraseña</Label>
                  <Input
                    id="admin-pass"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-pass2">Repetir contraseña</Label>
                  <Input
                    id="admin-pass2"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={busy}>
                {setupAdmin.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta y entrar
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight">
                  {step === "usuario" && "Ingresá a tu cuenta"}
                  {step === "clave" && `Hola${displayName ? `, ${displayName.split(" ")[0]}` : ""}`}
                  {step === "activar" && "Definí tu contraseña"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {step === "usuario" && "Usá el nombre de usuario que te dio la administración."}
                  {step === "clave" && "Escribí tu contraseña para continuar."}
                  {step === "activar" &&
                    "Es tu primer ingreso: pedí el código de activación a la administración y elegí tu contraseña."}
                </p>
              </div>

              {step === "usuario" && (
                <form
                  className="space-y-4"
                  onSubmit={event => {
                    event.preventDefault();
                    checkUser.mutate({ username });
                  }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="user">Usuario</Label>
                    <Input
                      id="user"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="ej. jperez"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="username"
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={busy}>
                    {checkUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Continuar
                  </Button>
                </form>
              )}

              {step === "clave" && (
                <form
                  className="space-y-4"
                  onSubmit={event => {
                    event.preventDefault();
                    login.mutate({ username, password });
                  }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="pass">Contraseña</Label>
                    <Input
                      id="pass"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="current-password"
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={busy}>
                    {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={reset}
                    disabled={busy}>
                    <ArrowLeft className="h-4 w-4" />
                    Cambiar de usuario
                  </Button>
                </form>
              )}

              {step === "activar" && (
                <form
                  className="space-y-4"
                  onSubmit={event => {
                    event.preventDefault();
                    if (password.length < 6) {
                      toast.error("La contraseña debe tener al menos 6 caracteres");
                      return;
                    }
                    if (password !== confirm) {
                      toast.error("Las contraseñas no coinciden");
                      return;
                    }
                    activate.mutate({ username, activationCode: code, password });
                  }}>
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Código de activación</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      placeholder="Ej. K7F2QA"
                      required
                      autoFocus
                      className="h-11 font-mono tracking-[0.2em] uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pass">Nueva contraseña</Label>
                    <Input
                      id="new-pass"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoComplete="new-password"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pass2">Repetir contraseña</Label>
                    <Input
                      id="new-pass2"
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={busy}>
                    {activate.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Guardar y entrar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={reset}
                    disabled={busy}>
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
