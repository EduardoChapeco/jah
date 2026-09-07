import { z } from "zod";

export type CaptureField = {
  id: string;
  label?: string;
  type?: string;
  required?: boolean;
};

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function createCaptureSchema(fields: CaptureField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const base = z.string().trim();
    const required = field.required === true;

    if (field.type === "email") {
      const schema = base
        .min(1, `${field.label || "Email"} é obrigatório`)
        .refine((value) => EMAIL_REGEX.test(normalizeEmail(value)), "Email inválido")
        .transform((value) => normalizeEmail(value));
      shape[field.id] = required ? schema : schema.optional().or(z.literal(""));
      continue;
    }

    if (field.type === "tel") {
      const schema = base
        .refine((value) => {
          if (!value) return !required;
          const phone = normalizePhone(value);
          return phone.length >= 10 && phone.length <= 15;
        }, `${field.label || "Telefone"} inválido`)
        .transform((value) => (value ? normalizePhone(value) : ""));
      shape[field.id] = required ? schema : schema.optional().or(z.literal(""));
      continue;
    }

    shape[field.id] = required
      ? base.min(1, `${field.label || "Campo"} é obrigatório`)
      : base.optional().or(z.literal(""));
  }

  return z.object(shape);
}
