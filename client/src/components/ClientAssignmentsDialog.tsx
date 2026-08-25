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
import { trpc } from "@/lib/trpc";
import { Check, Loader2, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  clientName: string;
  assignedIds: number[];
};

/** Selección explícita de la cartera comercial de un cliente. */
export function ClientAssignmentsDialog({
  open,
  onOpenChange,
  siteId,
  clientName,
  assignedIds,
}: Props) {
  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.listUsers.useQuery(undefined, { staleTime: 30_000 });
  const [selected, setSelected] = useState<number[]>(assignedIds);

  useEffect(() => {
    if (open) setSelected(assignedIds);
  }, [open, assignedIds]);

  const updateAssignments = trpc.admin.setSiteAssignments.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.sites.detail.invalidate({ id: siteId }),
        utils.sites.list.invalidate(),
        utils.admin.listUsers.invalidate(),
      ]);
      toast.success("Cartera comercial actualizada");
      onOpenChange(false);
    },
    onError: error => toast.error(error.message),
  });

  const sellers = (usersQuery.data ?? []).filter(user => user.role === "field" && user.active);
  const toggle = (userId: number) => {
    setSelected(current =>
      current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[88dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" />
            Asignar comerciales
          </DialogTitle>
          <DialogDescription>
            Elegí quiénes pueden ver, registrar visitas y cargar notas en <strong>{clientName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto space-y-2 pr-1">
          {usersQuery.isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sellers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no hay vendedores activos para asignar.
            </p>
          ) : (
            sellers.map(seller => {
              const checked = selected.includes(seller.id);
              return (
                <button
                  key={seller.id}
                  type="button"
                  onClick={() => toggle(seller.id)}
                  className={
                    "w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors " +
                    (checked
                      ? "border-primary bg-primary/7"
                      : "border-border hover:bg-secondary/60")
                  }>
                  <span
                    className={
                      "grid h-5 w-5 place-items-center rounded-md border shrink-0 " +
                      (checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background")
                    }>
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{seller.name ?? seller.username}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      @{seller.username ?? "sin usuario"}
                    </span>
                  </span>
                  {seller.zone && <Badge variant="outline" className="shrink-0">{seller.zone}</Badge>}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="bg-background"
            onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => updateAssignments.mutate({ siteId, userIds: selected })}
            disabled={updateAssignments.isPending || usersQuery.isLoading}>
            {updateAssignments.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
