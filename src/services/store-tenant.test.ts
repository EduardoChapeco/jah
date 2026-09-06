import { describe, it, expect } from "vitest";
import { saveStoreSettingsSchema } from "@/services/store.functions";

describe("Gestão de Lojas & Tenant — Ciclo 2 Microfase 2.1", () => {
 describe("Validação de Schema de Configurações da Loja", () => {
 it("valida payload completo de configurações da loja", () => {
 const validSettings = {
 name: "Wider Matriz Florianópolis",
 email: "gestao@jah.os",
 phone: "(48) 99999-8888",
 cnpj: "12.345.678/0001-90",
 address: "Av. Beira Mar Norte, 1000",
 city: "Florianópolis",
 state: "SC",
 zip_code: "88015-000",
 description: "Unidade modelo do ecossistema Wider OS",
 segment: "gastronomy",
 type: "food_service",
 niche: "gastronomy",
 enabled_modules: ["catalog", "orders", "pos", "delivery", "stock"],
 order_types: {
 delivery: true,
 takeout: true,
 dine_in: true,
 },
 };

 const parsed = saveStoreSettingsSchema.safeParse(validSettings);
 expect(parsed.success).toBe(true);
 });

 it("rejeita nome de loja com menos de 2 caracteres", () => {
 const invalidSettings = {
 name: "J",
 };

 const parsed = saveStoreSettingsSchema.safeParse(invalidSettings);
 expect(parsed.success).toBe(false);
 });

 it("aceita e-mail vazio ou opcional", () => {
 const settingsWithoutEmail = {
 name: "Lanchonete Central",
 email: "",
 };

 const parsed = saveStoreSettingsSchema.safeParse(settingsWithoutEmail);
 expect(parsed.success).toBe(true);
 });

 it("valida modalidades de atendimento padrão (delivery, takeout, dine_in)", () => {
 const settings = {
 name: "Empório Sul",
 order_types: {
 delivery: true,
 takeout: false,
 dine_in: false,
 },
 };

 const parsed = saveStoreSettingsSchema.safeParse(settings);
 expect(parsed.success).toBe(true);
 if (parsed.success) {
 expect(parsed.data.order_types?.delivery).toBe(true);
 expect(parsed.data.order_types?.takeout).toBe(false);
 }
 });
 });
});
