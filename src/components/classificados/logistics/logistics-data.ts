/**
 * Shared mock data, constants, types, and helpers for logistics sections.
 * Will be replaced by Supabase queries when tables are created.
 */

import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

/* ─── Types ─── */

export interface LogisticsRequest {
  id: string;
  type: string;
  origin: string;
  destination: string;
  date: string;
  time?: string;
  status: RequestStatus;
  customer: string;
  professional: string | null;
  notes?: string;
  items?: string;
  needsHelpers?: boolean;
  cancelReason?: string;
}

export interface Professional {
  id: string;
  name: string;
  cpf?: string;
  type: string;
  vehicle: string;
  status: "online" | "busy" | "offline";
  rating: number;
  phone: string;
  photo?: string;
  cnhCategory?: string;
  cnhExpiry?: string;
  schedule?: Record<string, boolean>;
}

export interface FleetVehicle {
  id: string;
  type: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  status: "active" | "maintenance" | "inactive";
  nextMaintenance: string;
  km?: number;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  service: string;
  date: string;
  cost: number;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  days: string;
  time: string;
  price: number;
  slots: number;
  booked: number;
}

export interface ServiceType {
  id: string;
  name: string;
  billing: "fixed" | "per_km" | "per_hour" | "per_slot" | "per_item";
  basePrice: number;
  area: string;
  rules: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  customer: string;
  rating: number;
  comment: string;
  professional: string;
  date: string;
  reply?: string;
}

export interface BusinessRules {
  cancellationFeePct: number;
  helperExtraCost: number;
  requireHeavyPhotos: boolean;
  requirePickupChecklist: boolean;
  requireDeliverySignature: boolean;
}

/* ─── Request status ─── */
export const STATUS_MAP = {
  new: { label: "Nova", color: "bg-accent/50 text-accent-foreground", icon: AlertTriangle },
  in_progress: { label: "Em andamento", color: "bg-secondary text-secondary-foreground", icon: Clock },
  completed: { label: "Concluída", color: "bg-primary/10 text-primary", icon: CheckCircle },
  cancelled: { label: "Cancelada", color: "bg-destructive/10 text-destructive", icon: XCircle },
} as const;

export type RequestStatus = keyof typeof STATUS_MAP;

/* ─── Professional status ─── */
export const PRO_STATUS_MAP: Record<string, { label: string; dotClass: string }> = {
  online: { label: "Online", dotClass: "bg-primary" },
  busy: { label: "Ocupado", dotClass: "bg-accent" },
  offline: { label: "Offline", dotClass: "bg-muted-foreground/30" },
};

/* ─── Billing labels ─── */
export const BILLING_LABELS: Record<string, string> = {
  fixed: "Preço fixo",
  per_km: "Por km",
  per_hour: "Por hora",
  per_slot: "Por vaga",
  per_item: "Por item",
};

/* ─── Mock data ─── */
export const INITIAL_REQUESTS: LogisticsRequest[] = [
  { id: "1", type: "Mudança", origin: "Rua A, 100 - Centro", destination: "Av. B, 200 - Jardins", date: "2026-03-05", time: "08:00", status: "new", customer: "Maria Silva", professional: null, items: "Sofá 3 lugares, Geladeira, Mesa de jantar", needsHelpers: true },
  { id: "2", type: "Frete", origin: "Rua C, 50", destination: "Rua D, 300", date: "2026-03-04", time: "14:00", status: "in_progress", customer: "João Santos", professional: "Carlos Motorista" },
  { id: "3", type: "Motoboy", origin: "Av. E, 10", destination: "Rua F, 80", date: "2026-03-03", time: "10:30", status: "completed", customer: "Ana Costa", professional: "Pedro Moto" },
  { id: "4", type: "Carona", origin: "Terminal Norte", destination: "Centro", date: "2026-03-02", time: "07:00", status: "cancelled", customer: "Lucas Alves", professional: null, cancelReason: "Cliente desistiu" },
];

export const INITIAL_PROFESSIONALS: Professional[] = [
  { id: "1", name: "Carlos Motorista", type: "Mudança", vehicle: "Fiorino 2020", status: "online", rating: 4.8, phone: "(11) 99999-0001", cnhCategory: "B", cnhExpiry: "2027-06-15", schedule: { Seg: true, Ter: true, Qua: true, Qui: true, Sex: true, Sáb: false, Dom: false } },
  { id: "2", name: "Pedro Moto", type: "Motoboy", vehicle: "Honda CG 160", status: "busy", rating: 4.5, phone: "(11) 99999-0002", cnhCategory: "A", cnhExpiry: "2028-01-20", schedule: { Seg: true, Ter: true, Qua: true, Qui: true, Sex: true, Sáb: true, Dom: false } },
  { id: "3", name: "Ana Transportes", type: "Frete", vehicle: "VUC Iveco", status: "offline", rating: 4.9, phone: "(11) 99999-0003", cnhCategory: "C", cnhExpiry: "2027-11-30", schedule: { Seg: true, Ter: true, Qua: true, Qui: true, Sex: true, Sáb: false, Dom: false } },
];

export const INITIAL_ROUTES: Route[] = [
  { id: "1", name: "Rota Centro-Norte", origin: "Terminal Central", destination: "Terminal Norte", days: "Seg-Sex", time: "07:00 / 18:00", price: 15, slots: 8, booked: 5 },
  { id: "2", name: "Rota Universitária", origin: "Estação Sul", destination: "Campus UFMG", days: "Seg-Sex", time: "06:30 / 17:30", price: 12, slots: 12, booked: 10 },
];

export const INITIAL_FLEET: FleetVehicle[] = [
  { id: "1", type: "VUC", plate: "ABC-1234", brand: "Iveco", model: "Daily", year: "2022", status: "active", nextMaintenance: "2026-04-01", km: 45000 },
  { id: "2", type: "Fiorino", plate: "DEF-5678", brand: "Fiat", model: "Fiorino", year: "2021", status: "maintenance", nextMaintenance: "2026-03-10", km: 62000 },
];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  { id: "1", vehicleId: "1", vehicleLabel: "Iveco Daily (ABC-1234)", service: "Revisão completa", date: "2026-02-15", cost: 1200 },
  { id: "2", vehicleId: "2", vehicleLabel: "Fiorino (DEF-5678)", service: "Troca de óleo", date: "2026-02-20", cost: 280 },
];

export const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { id: "1", name: "Mudança Residencial", billing: "fixed", basePrice: 350, area: "50km", rules: "Mín. 2 ajudantes", isActive: true },
  { id: "2", name: "Motoboy Express", billing: "per_km", basePrice: 5, area: "30km", rules: "Até 20kg", isActive: true },
  { id: "3", name: "Frete Comercial", billing: "per_km", basePrice: 8, area: "100km", rules: "Até 1.5t", isActive: true },
  { id: "4", name: "Carona Compartilhada", billing: "per_slot", basePrice: 15, area: "Rota fixa", rules: "Horário fixo", isActive: true },
];

export const INITIAL_REVIEWS: Review[] = [
  { id: "1", customer: "Maria Silva", rating: 5, comment: "Mudança impecável, cuidaram de tudo!", professional: "Carlos Motorista", date: "2026-03-03" },
  { id: "2", customer: "João Santos", rating: 4, comment: "Entrega rápida, recomendo.", professional: "Pedro Moto", date: "2026-03-02" },
  { id: "3", customer: "Fernanda Lima", rating: 5, comment: "Profissional pontual e educado.", professional: "Ana Transportes", date: "2026-03-01" },
  { id: "4", customer: "Roberto Dias", rating: 3, comment: "Demorou um pouco mas resolveu.", professional: "Carlos Motorista", date: "2026-02-28" },
];

export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  cancellationFeePct: 30,
  helperExtraCost: 80,
  requireHeavyPhotos: true,
  requirePickupChecklist: true,
  requireDeliverySignature: true,
};

/* ─── Helpers ─── */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
