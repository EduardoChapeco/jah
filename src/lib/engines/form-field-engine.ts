/**
 * JAH Form Field Engine
 * Motor Semântico de Campos Dinâmicos (20+ tipos), Validações Zod e Máscaras Canônicas.
 */

import { z } from 'zod';

export type SemanticFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency_brl'
  | 'cpf'
  | 'cnpj'
  | 'phone_br'
  | 'cep'
  | 'email'
  | 'date'
  | 'daterange'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'switch'
  | 'slider'
  | 'file_upload'
  | 'geo_coords'
  | 'barcode_ean'
  | 'rich_html'
  | 'color_hex'
  | 'rating';

export interface FieldSelectOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
}

export interface SemanticFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: SemanticFieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: unknown;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  options?: FieldSelectOption[];
  allowedMimeTypes?: string[];
  maxFileSizeMB?: number;
  readOnly?: boolean;
}

export class FormFieldEngine {
  // ─── 1. VALIDAÇÃO ESTOCÁSTICA DE CPF (MÓDULO 11) ───
  public static isValidCPF(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false; // Bloqueia repetidos como 111.111...

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    return rev === parseInt(clean.charAt(10), 10);
  }

  // ─── 2. VALIDAÇÃO ESTOCÁSTICA DE CNPJ (MÓDULO 11) ───
  public static isValidCNPJ(cnpj: string): boolean {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(clean)) return false;

    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) return false;

    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1), 10);
  }

  // ─── 3. VALIDAÇÃO DE CÓDIGO DE BARRAS EAN-13 ───
  public static isValidEAN13(ean: string): boolean {
    const clean = ean.replace(/\D/g, '');
    if (clean.length !== 13) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const num = parseInt(clean.charAt(i), 10);
      sum += i % 2 === 0 ? num : num * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(clean.charAt(12), 10);
  }

  // ─── 4. MÁSCARAS & FORMATADORES ───
  public static formatCPF(cpf: string): string {
    const clean = cpf.replace(/\D/g, '').slice(0, 11);
    return clean.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, p1, p2, p3, p4) => {
      let res = p1;
      if (p2) res += '.' + p2;
      if (p3) res += '.' + p3;
      if (p4) res += '-' + p4;
      return res;
    });
  }

  public static formatCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '').slice(0, 14);
    return clean.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, p1, p2, p3, p4, p5) => {
      let res = p1;
      if (p2) res += '.' + p2;
      if (p3) res += '.' + p3;
      if (p4) res += '/' + p4;
      if (p5) res += '-' + p5;
      return res;
    });
  }

  public static formatCurrencyBRL(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  }

  public static parseCurrencyBRLToCents(val: string): number {
    const clean = val.replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  }

  // ─── 5. GERADOR DINÂMICO DE ZOD SCHEMA ───
  public static buildZodSchema(fields: SemanticFieldDefinition[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const field of fields) {
      let schema: z.ZodTypeAny;

      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'rich_html': {
          let str = z.string();
          if (field.minLength !== undefined) str = str.min(field.minLength, { message: `Mínimo de ${field.minLength} caracteres` });
          if (field.maxLength !== undefined) str = str.max(field.maxLength, { message: `Máximo de ${field.maxLength} caracteres` });
          schema = str;
          break;
        }

        case 'number':
        case 'currency_brl':
        case 'slider':
        case 'rating': {
          let num = z.number();
          if (field.min !== undefined) num = num.min(field.min, { message: `Valor mínimo é ${field.min}` });
          if (field.max !== undefined) num = num.max(field.max, { message: `Valor máximo é ${field.max}` });
          schema = num;
          break;
        }

        case 'email':
          schema = z.string().email({ message: 'E-mail inválido' });
          break;

        case 'cpf':
          schema = z.string().refine((val) => this.isValidCPF(val), { message: 'CPF inválido' });
          break;

        case 'cnpj':
          schema = z.string().refine((val) => this.isValidCNPJ(val), { message: 'CNPJ inválido' });
          break;

        case 'barcode_ean':
          schema = z.string().refine((val) => this.isValidEAN13(val), { message: 'Código EAN-13 inválido' });
          break;

        case 'phone_br':
          schema = z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, { message: 'Telefone brasileiro inválido' });
          break;

        case 'cep':
          schema = z.string().regex(/^\d{5}-?\d{3}$/, { message: 'CEP inválido' });
          break;

        case 'date':
        case 'time':
          schema = z.string();
          break;

        case 'switch':
          schema = z.boolean();
          break;

        case 'select':
          schema = z.union([z.string(), z.number()]);
          break;

        case 'multiselect':
          schema = z.array(z.union([z.string(), z.number()]));
          break;

        case 'color_hex':
          schema = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, { message: 'Cor hexadecimal inválida' });
          break;

        case 'geo_coords':
          schema = z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          });
          break;

        case 'daterange':
          schema = z.object({
            start: z.string(),
            end: z.string(),
          });
          break;

        case 'file_upload':
          schema = z.string().url().or(z.string());
          break;

        default:
          schema = z.any();
          break;
      }

      if (!field.required) {
        schema = schema.optional().nullable();
      }

      shape[field.name] = schema;
    }

    return z.object(shape);
  }
}
