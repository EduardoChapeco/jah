import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Building, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { setTenantContextHandler } from "@/services/identity.functions";
import type { ServerIdentity } from "@/lib/identity-core";

interface TenantSwitcherProps {
  identity: ServerIdentity;
}

export function TenantSwitcher({ identity }: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const activeStoreId = identity.store_id;
  const activeMembership = identity.memberships.find(
    (m) => m.store_id === activeStoreId
  );

  const setContextMutation = useMutation({
    mutationFn: async (store_id: string) => {
      return setTenantContextHandler({ data: { store_id } });
    },
    onSuccess: () => {
      // Força recarregamento completo dos dados via Router (invalida todo o cache)
      router.invalidate();
      setOpen(false);
    },
    onError: (error) => {
      console.error("Failed to switch context", error);
      // Aqui poderíamos ter um toast.error
    },
  });

  if (identity.memberships.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground">
        <Building className="h-4 w-4" />
        {activeMembership?.name || "Jah Platform"}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between sm:w-[240px]"
          disabled={setContextMutation.isPending}
        >
          <div className="flex items-center gap-2 truncate">
            <Building className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {activeMembership?.name || "Selecione o Contexto..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar loja..." />
          <CommandList>
            <CommandEmpty>Nenhuma loja encontrada.</CommandEmpty>
            <CommandGroup heading="Seus Contextos">
              {identity.memberships.map((membership) => (
                <CommandItem
                  key={membership.store_id}
                  value={membership.name || membership.store_id}
                  onSelect={() => {
                    if (membership.store_id !== activeStoreId) {
                      setContextMutation.mutate(membership.store_id);
                    } else {
                      setOpen(false);
                    }
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    {membership.logo_url ? (
                      <img
                        src={membership.logo_url}
                        alt="Logo"
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <Building className="h-4 w-4" />
                    )}
                    <span className="truncate">{membership.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      activeStoreId === membership.store_id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
