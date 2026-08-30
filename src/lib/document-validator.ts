/**
 * document-validator.ts — Validação Estrita de Documentos Brasileiros (CPF / CNPJ)
 * Implementa algoritmo Mod-11 oficial da Receita Federal do Brasil.
 *
 * Utilizado em validações Zod, Server Functions e proteção KYC.
 */

/**
 * Remove todos os caracteres não-numéricos de uma string.
 */
export function cleanDocument(val?: string | null): string {
  if (!val) return "";
  return val.replace(/\D/g, "");
}

/**
 * Valida se um CPF é estruturalmente válido segundo o algoritmo Módulo 11 oficial.
 * Rejeita dígitos repetidos (ex: 111.111.111-11) e tamanhos inválidos.
 */
export function validateCpfMod11(rawCpf?: string | null): boolean {
  const cpf = cleanDocument(rawCpf);

  if (cpf.length !== 11) return false;

  // Rejeita sequências de dígitos iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

/**
 * Valida se um CNPJ é estruturalmente válido segundo o algoritmo Módulo 11 oficial.
 */
export function validateCnpjMod11(rawCnpj?: string | null): boolean {
  const cnpj = cleanDocument(rawCnpj);

  if (cnpj.length !== 14) return false;

  // Rejeita sequências de dígitos iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Primeiro dígito verificador
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  // Segundo dígito verificador
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
}

/**
 * Formata um CPF no padrão 000.000.000-00.
 */
export function formatCpf(val?: string | null): string {
  const clean = cleanDocument(val);
  if (clean.length !== 11) return val || "";
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata um CNPJ no padrão 00.000.000/0000-00.
 */
export function formatCnpj(val?: string | null): string {
  const clean = cleanDocument(val);
  if (clean.length !== 14) return val || "";
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
