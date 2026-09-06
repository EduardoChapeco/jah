import { describe, it, expect } from "vitest";
import { LoginSchema, RegisterSchema, ClientRegisterSchema } from "@/lib/contracts/auth.schema";
import { cleanDocument, validateCpfMod11 } from "@/lib/document-validator";

describe("Autenticação e Identidade — Ciclo 1 Microfase 1.1", () => {
 describe("Validação de Contratos e Schemas Zod", () => {
 it("valida login com identificador por e-mail", () => {
 const validEmailLogin = {
 identifier: "operador@jah.os",
 password: "Password123!",
 };
 const parsed = LoginSchema.safeParse(validEmailLogin);
 expect(parsed.success).toBe(true);
 });

 it("valida login com identificador por @username", () => {
 const validUsernameLogin = {
 identifier: "@gestor_master",
 password: "Password123!",
 };
 const parsed = LoginSchema.safeParse(validUsernameLogin);
 expect(parsed.success).toBe(true);
 });

 it("rejeita senha em branco no login", () => {
 const emptyPasswordLogin = {
 identifier: "usuario@jah.os",
 password: "",
 };
 const parsed = LoginSchema.safeParse(emptyPasswordLogin);
 expect(parsed.success).toBe(false);
 });

 it("valida cadastro com consentimento LGPD obrigatório", () => {
 const validRegister = {
 fullName: "Administrador JAH",
 email: "admin@jah.os",
 password: "SegredoForte2026!",
 isConsentLgpd: true as const,
 };
 const parsed = ClientRegisterSchema.safeParse(validRegister);
 expect(parsed.success).toBe(true);
 });

 it("rejeita cadastro sem consentimento LGPD", () => {
 const invalidRegister = {
 fullName: "Usuário Teste",
 email: "teste@jah.os",
 password: "SegredoForte2026!",
 isConsentLgpd: false,
 };
 const parsed = ClientRegisterSchema.safeParse(invalidRegister);
 expect(parsed.success).toBe(false);
 });
 });

 describe("Sanitização de Documentos e Identificadores", () => {
 it("higieniza CPF removendo caracteres não-numéricos", () => {
 const rawCpf = "123.456.789-00";
 const cleaned = cleanDocument(rawCpf);
 expect(cleaned).toBe("12345678900");
 });

 it("rejeita CPFs inválidos com dígitos verificadores incorretos", () => {
 expect(validateCpfMod11("11111111111")).toBe(false);
 expect(validateCpfMod11("00000000000")).toBe(false);
 expect(validateCpfMod11("12345678900")).toBe(false);
 });

 it("valida CPF matematicamente correto", () => {
 expect(validateCpfMod11("52998224725")).toBe(true);
 });
 });
});
