import { useAuth } from "@/_core/hooks/useAuth";
import { FieldShell } from "@/components/FieldShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, Loader2, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Perfil actualizado");
    },
    onError: error => toast.error(error.message),
  });

  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Contraseña actualizada");
    },
    onError: error => toast.error(error.message),
  });

  return (
    <FieldShell title="Mi perfil" subtitle={`@${user?.username ?? ""}`}>
      <div className="space-y-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>

        <div className="surface-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            <p className="font-medium">Datos personales</p>
            <Badge variant="secondary" className="ml-auto">
              {user?.role === "admin" ? "Administrador" : "Vendedor"}
            </Badge>
          </div>
          <form
            className="space-y-3"
            onSubmit={event => {
              event.preventDefault();
              updateProfile.mutate({ name, phone });
            }}>
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nombre y apellido</Label>
              <Input
                id="p-name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Teléfono</Label>
              <Input
                id="p-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </form>
        </div>

        <div className="surface-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <p className="font-medium">Cambiar contraseña</p>
          </div>
          <form
            className="space-y-3"
            onSubmit={event => {
              event.preventDefault();
              if (next.length < 6) {
                toast.error("La nueva contraseña debe tener al menos 6 caracteres");
                return;
              }
              if (next !== confirm) {
                toast.error("Las contraseñas no coinciden");
                return;
              }
              changePassword.mutate({ currentPassword: current, newPassword: next });
            }}>
            <div className="space-y-1.5">
              <Label htmlFor="p-current">Contraseña actual</Label>
              <Input
                id="p-current"
                type="password"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                className="h-11"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-next">Nueva contraseña</Label>
              <Input
                id="p-next"
                type="password"
                value={next}
                onChange={e => setNext(e.target.value)}
                className="h-11"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-confirm">Repetir nueva contraseña</Label>
              <Input
                id="p-confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="h-11"
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </Button>
          </form>
        </div>
      </div>
    </FieldShell>
  );
}

