import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { logAuditAction } from "./audit.functions";

/**
 * Returns a list of employees for the store along with their calculated financial balance.
 * Balance is calculated dynamically: Total Unpaid Commissions + Adhoc Credits - Advances/Debits.
 */
export const listEmployeesBalance = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  // 1. Fetch all store staff profiles via workspace_members
  const { data: storeStaff, error: staffErr } = await supabase
    .from("workspace_members")
    .select("profile_id, role, profiles(full_name)")
    .eq("store_id", identity.store_id);

  if (staffErr || !storeStaff) return [];

  // 2. Fetch all financial records for the store
  const { data: records, error: recordsErr } = await supabase
    .from("employee_financial_records")
    .select("*")
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (recordsErr) return [];

  // 3. Calculate dynamic balance per employee
  return storeStaff.map((staff) => {
    const employeeRecords = records.filter((r) => r.employee_id === staff.profile_id);

    let totalCredits = 0;
    let totalDebits = 0;

    employeeRecords.forEach((record) => {
      if (record.amount_cents > 0) {
        totalCredits += record.amount_cents;
      } else {
        totalDebits += Math.abs(record.amount_cents);
      }
    });

    return {
      id: staff.profile_id,
      name: (staff.profiles as any)?.full_name || "Colaborador",
      role: staff.role,
      balanceCents: totalCredits - totalDebits,
      recentRecords: employeeRecords.slice(0, 5),
    };
  });
});

/**
 * Register a financial event for an employee (e.g., Cash Advance, Manual Bonus)
 */
export const registerFinancialEvent = createServerFn({ method: "POST" })
  .validator(
    z.object({
      employeeId: z.string().uuid(),
      amountCents: z.number(),
      type: z.enum(["commission", "advance", "adjustment", "salary"]),
      description: z.string().min(3),
    }),
  )
  .handler(async ({ data: { employeeId, amountCents, type, description } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "finance"]);

    // If it's an advance (vale), it should be a negative amount
    let finalAmount = amountCents;
    if (type === "advance" && finalAmount > 0) {
      finalAmount = -finalAmount;
    }

    const { data: record, error } = await supabase
      .from("employee_financial_records")
      .insert({
        store_id: identity.store_id,
        employee_id: employeeId,
        amount_cents: finalAmount,
        type,
        description,
        metadata: { registered_by: identity.id },
      })
      .select("id")
      .single();

    if (error) {
      throw new Error("Erro ao lançar evento financeiro: " + error.message);
    }

    // Immutable audit log
    await logAuditAction(
      identity,
      "FINANCIAL_EVENT_REGISTERED",
      "employee_financial_records",
      record.id,
      {
        employeeId,
        amountCents: finalAmount,
        type,
        description,
      },
    );

    return { status: "success", recordId: record.id };
  });
