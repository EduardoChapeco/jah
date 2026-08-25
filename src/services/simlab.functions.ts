/**
 * Server Functions para o Wider SimLab (Simulação de Personas e Validação de Ofertas)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerIdentity, assertStoreAccess, STAFF_ROLES } from "@/lib/server-access";
import { SEED_PERSONAS } from "@/lib/simlab/seed-personas";
import { runSimulation, type SimulationResult } from "@/lib/simlab/simulator";

const RunSimulationSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().min(5, "Descrição necessária para simulação"),
  priceCents: z.number().min(0),
  niche: z.enum(["eventos", "gastronomia", "moda", "musica", "servicos", "classificados"]),
  format: z.enum(["produto", "evento", "flyer", "post", "servico"]).optional(),
  targetAudienceHint: z.string().optional(),
});

export const getSimLabStatus = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity();
  const isAdmin = identity.role === "owner" || identity.role === "admin";

  // Por padrão ativo para o admin global / owners
  return {
    isEnabled: true,
    isAdmin,
    role: identity.role,
  };
});

export const getSeedPersonas = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, STAFF_ROLES);
  return SEED_PERSONAS;
});

export const runPersonaSimulation = createServerFn({ method: "POST" })
  .validator(RunSimulationSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, STAFF_ROLES);

    const result = runSimulation({
      title: data.title,
      description: data.description,
      priceCents: data.priceCents,
      niche: data.niche,
      format: data.format,
      targetAudienceHint: data.targetAudienceHint,
    });

    return result;
  });
