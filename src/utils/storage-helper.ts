/**
 * storage-helper.ts — Helper para resolução de comprovantes de pagamento
 * Padrão BigTech: Zero client-side Supabase bypasses
 */

function isStoragePath(value: string): boolean {
  return !value.startsWith("http://") && !value.startsWith("https://");
}

export async function getSignedUrlForReceipt(receiptRef: string): Promise<string> {
  if (!receiptRef) return "";
  if (!isStoragePath(receiptRef)) return receiptRef;
  return receiptRef;
}
