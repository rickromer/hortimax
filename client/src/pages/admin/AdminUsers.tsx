import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { timeAgo } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Copy, KeyRound, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CreatedInfo = { name: string; username: string; activationCode: string } | null;

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.listUsers.useQuery();
  const catalog = trpc.admin.catalog.useQuery(undefined, { staleTime: 5 * 60 * 1000 });

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"field" | "manager" | "admin">("field");
  const [zone, setZone] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [created, setCreated] = useState<CreatedInfo>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimUsername, setClaimUsername] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [claimTarget, setClaimTarget] = useState<{ id: number; name: string } | null>(null);

  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: async data => {
      await utils.admin.listUsers.invalidate();
      setCreated({ name, username: data.username, activationCode: data.activationCode });
      setCreateOpen(false);
      setName("");
      setUsername("");
      setRole("field");
      setZone("");
      setPhone("");
    },
    onError: error => toast.error(error.message),
  });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: async () => {
      await utils.admin.listUsers.invalidate();
      toast.success("Usuario actualizado");
    },
    onError: error => toast.error(error.message),
  });

  const resetPassword = trpc.admin.resetPassword.useMutation({
    onSuccess: async data => {
      await utils.admin.listUsers.invalidate();
      toast.success(`Nuevo código de activación: ${data.activationCode}`, { duration: 12000 });
    },
    onError: error => toast.error(error.message),
  });

  const setPassword = trpc.admin.setPassword.useMutation({
    onError: error => toast.error(error.message),
  });

  const claimAccount = trpc.admin.updateUser.useMutation({
    onError: error => toast.error(error.message),
  });

  /** Asigna usuario + contraseña a una cuenta que aún no tiene credenciales locales. */
  const submitClaim = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!claimTarget) return;
    if (claimPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      await claimAccount.mutateAsync({ id: claimTarget.id, username: claimUsername });
      await setPassword.mutateAsync({ id: claimTarget.id, password: claimPassword });
      await utils.admin.listUsers.invalidate();
      setClaimOpen(false);
      setClaimUsername("");
      setClaimPassword("");
      toast.success("Credenciales definidas");
    } catch {
      /* el error ya se informa en onError */
    }
  };

  const users = usersQuery.data ?? [];

  const copiar = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copiado al portapapeles"))
      .catch(() => toast.error("No se pudo copiar"));
  };

  return (
    <AdminShell
      title="Usuarios"
      description="Altas, credenciales y privilegios del equipo comercial"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo usuario</span>
        </Button>
      }>
      <div className="space-y-4 max-w-6xl">
        <div className="surface-card p-4 text-sm text-muted-foreground leading-relaxed">
          Al crear un usuario se genera un <strong className="text-foreground">código de
          activación</strong> de un solo uso. El vendedor ingresa con su nombre de usuario,
          escribe ese código y define su propia contraseña en el primer acceso.
        </div>

        {users.some(u => !u.username) && (
          <div className="surface-card p-4 border-l-4 border-l-accent">
            <p className="font-medium text-sm">Cuentas sin credenciales locales</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Hay cuentas que todavía no tienen nombre de usuario ni contraseña propios. Definilos
              con el botón <em>Definir acceso</em> para poder ingresar desde la pantalla de login.
            </p>
          </div>
        )}

        {usersQuery.isLoading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <>
            <div className="surface-card overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead className="text-center">Clientes</TableHead>
                    <TableHead className="text-center">Visitas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.username ? `@${user.username}` : "sin usuario"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={value =>
                            updateUser.mutate({ id: user.id, role: value as "field" | "manager" | "admin" })
                          }>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="field">Representante de campo</SelectItem>
                            <SelectItem value="manager">Gerente comercial</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm">{user.zone ?? "—"}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {user.sitesCount}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {user.checkinsCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.active}
                            onCheckedChange={checked =>
                              updateUser.mutate({ id: user.id, active: checked })
                            }
                          />
                          {user.mustChangePassword && (
                            <Badge variant="outline" className="text-[10px]">
                              pendiente
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {timeAgo(user.lastSignedIn)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {user.activationCode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="font-mono text-xs"
                            onClick={() => copiar(user.activationCode!)}>
                            <Copy className="h-3 w-3" />
                            {user.activationCode}
                          </Button>
                        )}
                        {user.username ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-background"
                            onClick={() => resetPassword.mutate({ id: user.id })}
                            disabled={resetPassword.isPending}>
                            <KeyRound className="h-3.5 w-3.5" />
                            Reiniciar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setClaimTarget({ id: user.id, name: user.name ?? "" });
                              setClaimUsername("");
                              setClaimPassword("");
                              setClaimOpen(true);
                            }}>
                            <KeyRound className="h-3.5 w-3.5" />
                            Definir acceso
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-2">
              {users.map(user => (
                <div key={user.id} className="surface-card p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.username ? `@${user.username}` : "sin usuario"}
                      </p>
                    </div>
                    <Badge variant={user.role === "admin" ? "default" : user.role === "manager" ? "outline" : "secondary"}>
                      {user.role === "admin" ? "Administrador" : user.role === "manager" ? "Gerente comercial" : "Representante de campo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <strong className="tabular-nums">{user.sitesCount}</strong>{" "}
                      <span className="text-muted-foreground">clientes</span>
                    </span>
                    <span>
                      <strong className="tabular-nums">{user.checkinsCount}</strong>{" "}
                      <span className="text-muted-foreground">visitas</span>
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Activo</span>
                      <Switch
                        checked={user.active}
                        onCheckedChange={checked =>
                          updateUser.mutate({ id: user.id, active: checked })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.activationCode && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-mono text-xs flex-1"
                        onClick={() => copiar(user.activationCode!)}>
                        <Copy className="h-3 w-3" />
                        {user.activationCode}
                      </Button>
                    )}
                    {user.username ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-background flex-1"
                        onClick={() => resetPassword.mutate({ id: user.id })}>
                        <KeyRound className="h-3.5 w-3.5" />
                        Reiniciar clave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setClaimTarget({ id: user.id, name: user.name ?? "" });
                          setClaimUsername("");
                          setClaimPassword("");
                          setClaimOpen(true);
                        }}>
                        <KeyRound className="h-3.5 w-3.5" />
                        Definir acceso
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Alta de usuario */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Se genera un código de activación para que la persona defina su contraseña.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={event => {
              event.preventDefault();
              createUser.mutate({
                name,
                username,
                role,
                zone: zone || undefined,
                phone: phone || undefined,
              });
            }}>
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Nombre y apellido</Label>
              <Input
                id="u-name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-user">Nombre de usuario</Label>
              <Input
                id="u-user"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ej. jperez"
                required
                autoCapitalize="none"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={role} onValueChange={v => setRole(v as "field" | "manager" | "admin")}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field">Representante de campo</SelectItem>
                    <SelectItem value="manager">Gerente comercial</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zona principal</Label>
                <Select value={zone || undefined} onValueChange={setZone}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {(catalog.data?.zones ?? []).map(item => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-phone">Teléfono</Label>
              <Input
                id="u-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-11"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-background"
                onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recuperación de cuentas creadas antes del acceso local */}
      <Dialog
        open={claimOpen}
        onOpenChange={open => {
          setClaimOpen(open);
          if (!open) setClaimTarget(null);
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Definir acceso</DialogTitle>
            <DialogDescription>
              Creá las credenciales locales para {claimTarget?.name || "esta cuenta"}. Luego podrá
              entrar directamente desde la pantalla de acceso.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={submitClaim}>
            <div className="space-y-1.5">
              <Label htmlFor="claim-username">Nombre de usuario</Label>
              <Input
                id="claim-username"
                value={claimUsername}
                onChange={event => setClaimUsername(event.target.value)}
                placeholder="ej. rromero"
                autoCapitalize="none"
                autoComplete="username"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-password">Contraseña inicial</Label>
              <Input
                id="claim-password"
                type="password"
                value={claimPassword}
                onChange={event => setClaimPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                minLength={6}
                required
                className="h-11"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-background"
                onClick={() => setClaimOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={claimAccount.isPending || setPassword.isPending}>
                {(claimAccount.isPending || setPassword.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Guardar acceso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credenciales generadas */}
      <Dialog open={Boolean(created)} onOpenChange={open => !open && setCreated(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Usuario creado</DialogTitle>
            <DialogDescription>
              Pasale estos datos a {created?.name}. El código sirve una sola vez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-secondary px-4 py-3">
              <p className="text-xs text-muted-foreground">Usuario</p>
              <p className="font-mono font-semibold text-lg">{created?.username}</p>
            </div>
            <div className="rounded-lg bg-accent px-4 py-3">
              <p className="text-xs text-accent-foreground/70">Código de activación</p>
              <p className="font-mono font-bold text-2xl tracking-[0.25em] text-accent-foreground">
                {created?.activationCode}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="bg-background"
              onClick={() =>
                copiar(
                  `Usuario: ${created?.username}\nCódigo de activación: ${created?.activationCode}`
                )
              }>
              <Copy className="h-4 w-4" />
              Copiar datos
            </Button>
            <Button onClick={() => setCreated(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
