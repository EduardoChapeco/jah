import { describe, expect, it, vi, beforeEach } from "vitest";
import { createCaptureSchema } from "./publicCaptureValidation";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { submitPublicCapture } from "./publicCaptureService";

describe("public capture integration flow", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    window.localStorage.clear();
  });

  it("submissão válida", async () => {
    const schema = createCaptureSchema([
      { id: "nome", label: "Nome", type: "text", required: true },
      { id: "email", label: "Email", type: "email", required: true },
      { id: "telefone", label: "Telefone", type: "tel", required: false },
    ]);

    const parsed = schema.parse({
      nome: "Maria Lead",
      email: "Maria@Example.com",
      telefone: "(11) 99888-7777",
    });

    rpcMock.mockResolvedValue({ data: [{ entry_id: "entry-1" }], error: null });

    await submitPublicCapture({
      slug: "captura-evento",
      payload: parsed,
      campaignId: "campaign-1",
    });

    expect(rpcMock).toHaveBeenCalledWith("submit_public_lead_capture", expect.objectContaining({
      p_form_slug: "captura-evento",
      p_campaign_id: "campaign-1",
    }));
  });

  it("spam/requisição repetida", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "Rate limit excedido para este formulário" },
    });

    await expect(
      submitPublicCapture({
        slug: "captura-evento",
        payload: { nome: "Spam", email: "spam@example.com" },
        campaignId: "campaign-1",
      }),
    ).rejects.toMatchObject({ message: "Rate limit excedido para este formulário" });
  });

  it("comportamento sem campaignId", async () => {
    rpcMock.mockResolvedValue({ data: [{ entry_id: "entry-2" }], error: null });

    await submitPublicCapture({
      slug: "captura-evento",
      payload: { nome: "João", email: "joao@example.com" },
    });

    expect(rpcMock).toHaveBeenCalledWith("submit_public_lead_capture", expect.objectContaining({
      p_campaign_id: null,
    }));
  });
});
