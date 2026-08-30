/**
 * session-audit.server.ts — Motor de Auditoria de Sessões, Forense e Detecção de Ameaças (Padrão BigTech/Bancário)
 *
 * Captura telemetria completa via Cloudflare Headers, calcula score de risco,
 * registra logs imutáveis em `session_audit_logs` e gerencia o catálogo de dispositivos (`device_registry`).
 *
 * SERVIDOR APENAS.
 */

import { getServerClient } from "@/lib/supabase";

export type AuditEventType =
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_reset_requested"
  | "password_reset_completed"
  | "signup"
  | "session_revoked"
  | "suspicious_activity"
  | "impossible_travel"
  | "new_device_detected"
  | "portal_login";

export interface RequestSecurityContext {
  ip: string;
  userAgent: string;
  country: string;
  city: string;
  deviceType: string;
  isDatacenter: boolean;
  threatScore: number;
  cfRay: string;
}

export interface RecordSessionAuditParams {
  profileId?: string | null;
  eventType: AuditEventType;
  request?: Request | null;
  deviceFingerprint?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Extrai todos os cabeçalhos de segurança e geolocalização fornecidos nativamente pela Cloudflare.
 */
export function extractSecurityContext(req?: Request | null): RequestSecurityContext {
  if (!req) {
    return {
      ip: "127.0.0.1",
      userAgent: "Unknown / Server Function",
      country: "BR",
      city: "Localhost",
      deviceType: "desktop",
      isDatacenter: false,
      threatScore: 0,
      cfRay: "local-ray",
    };
  }

  const headers = req.headers;

  const ip =
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  const userAgent = headers.get("user-agent") || "Unknown Browser";
  const country = headers.get("cf-ipcountry") || "BR";
  const city = headers.get("cf-ipcity") || "Desconhecida";
  
  // Cloudflare Device Type (mobile, tablet, desktop)
  const deviceType = headers.get("cf-device-type") || 
    (userAgent.toLowerCase().includes("mobile") ? "mobile" : "desktop");

  // Detecção de VPS/Datacenter/VPN via headers Cloudflare (quando disponível) ou ASN
  const cfIpType = headers.get("cf-iptype") || "";
  const isDatacenter = cfIpType.toLowerCase().includes("datacenter") || 
                       cfIpType.toLowerCase().includes("vpn") || 
                       cfIpType.toLowerCase().includes("bot");

  // Threat Score Cloudflare (0 = limpo, 100 = ataque ativo)
  const threatScore = parseInt(headers.get("cf-threat-score") || "0", 10) || 0;
  const cfRay = headers.get("cf-ray") || "no-ray";

  return {
    ip,
    userAgent,
    country,
    city,
    deviceType,
    isDatacenter,
    threatScore,
    cfRay,
  };
}

/**
 * Deriva um nome amigável para o dispositivo a partir do User-Agent (ex: "Chrome no Windows", "Safari no iPhone").
 */
export function parseDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  let browser = "Navegador";
  let os = "Dispositivo";

  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone")) os = "iPhone";
  else if (ua.includes("ipad")) os = "iPad";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return `${browser} no ${os}`;
}

/**
 * Registra o evento de autenticação na tabela `session_audit_logs` e gerencia `device_registry`.
 * Executado assincronamente sem bloquear a resposta do usuário caso ocorra erro transitório.
 */
export async function recordAuthAuditEvent(params: RecordSessionAuditParams): Promise<{
  auditId: string | null;
  riskScore: number;
  isNewDevice: boolean;
  riskFlags: string[];
}> {
  const { profileId, eventType, request, deviceFingerprint, metadata = {} } = params;
  const ctx = extractSecurityContext(request);
  const db = getServerClient();

  const riskFlags: string[] = [];
  let isNewDevice = false;

  // 1. Verificar se é um novo dispositivo para o perfil
  const fp = deviceFingerprint || `fp_${Buffer.from(ctx.userAgent + ctx.ip).toString("base64").slice(0, 32)}`;
  
  if (profileId) {
    try {
      const { data: existingDevice } = await db
        .from("device_registry")
        .select("id, is_trusted")
        .eq("profile_id", profileId)
        .eq("device_fingerprint", fp)
        .maybeSingle();

      if (!existingDevice) {
        isNewDevice = true;
        riskFlags.push("new_device");

        // Cadastra o novo dispositivo
        await db.from("device_registry").insert({
          profile_id: profileId,
          device_fingerprint: fp,
          device_name: parseDeviceName(ctx.userAgent),
          device_type: ctx.deviceType,
          country_code: ctx.country,
          city: ctx.city,
          ip_address: ctx.ip === "127.0.0.1" ? null : ctx.ip,
          is_trusted: eventType === "login_success" ? false : false,
        });
      } else {
        // Atualiza last_seen
        await db
          .from("device_registry")
          .update({
            last_seen_at: new Date().toISOString(),
            ip_address: ctx.ip === "127.0.0.1" ? null : ctx.ip,
            city: ctx.city,
          })
          .eq("id", existingDevice.id);
      }
    } catch (e) {
      console.warn("[session-audit] Falha ao consultar/atualizar device_registry:", e);
    }
  }

  // 2. Flags de risco adicionais
  if (ctx.isDatacenter) {
    riskFlags.push("datacenter_or_vpn");
  }
  if (ctx.threatScore > 20) {
    riskFlags.push(`high_threat_score_${ctx.threatScore}`);
  }
  if (ctx.country !== "BR") {
    riskFlags.push(`foreign_country_${ctx.country}`);
  }
  if (eventType === "login_failed") {
    riskFlags.push("failed_credentials");
  }

  // 3. Calcula score de risco
  let riskScore = 0;
  if (ctx.isDatacenter) riskScore += 40;
  if (ctx.threatScore > 0) riskScore += Math.min(Math.round(ctx.threatScore / 2), 30);
  if (ctx.country !== "BR") riskScore += 15;
  if (isNewDevice) riskScore += 10;
  if (eventType === "login_failed") riskScore += 15;
  riskScore = Math.min(riskScore, 100);

  // 4. Insere log imutável
  let auditId: string | null = null;
  try {
    const { data: inserted } = await db
      .from("session_audit_logs")
      .insert({
        profile_id: profileId || null,
        event_type: eventType,
        ip_address: ctx.ip === "127.0.0.1" ? null : ctx.ip,
        user_agent: ctx.userAgent,
        country_code: ctx.country,
        city: ctx.city,
        device_type: ctx.deviceType,
        is_datacenter: ctx.isDatacenter,
        threat_score: ctx.threatScore,
        cf_ray: ctx.cfRay,
        device_fingerprint: fp,
        risk_score: riskScore,
        risk_flags: riskFlags,
        metadata: {
          ...metadata,
          device_name: parseDeviceName(ctx.userAgent),
        },
      })
      .select("id")
      .maybeSingle();

    auditId = inserted?.id || null;
  } catch (err) {
    console.error("[session-audit] Erro ao gravar log de auditoria:", err);
  }

  return {
    auditId,
    riskScore,
    isNewDevice,
    riskFlags,
  };
}
