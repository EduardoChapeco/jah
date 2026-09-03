import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const TaskPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export const TaskStatusEnum = z.enum(["todo", "in_progress", "review", "done", "archived"]);
export const TaskContextTypeEnum = z.enum([
  "general",
  "order",
  "lead",
  "group_tour",
  "table",
  "customer",
  "inventory",
  "lawsuit",
  "contract",
  "service",
  "vehicle",
  "real_estate",
]);

export const CreateTaskInputSchema = z.object({
  store_id: z.string().uuid(),
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().optional(),
  priority: TaskPriorityEnum.default("medium"),
  status: TaskStatusEnum.default("todo"),
  due_date: z.string().optional().nullable(),
  assigned_to_profile_id: z.string().uuid().optional().nullable(),
  context_type: TaskContextTypeEnum.default("general"),
  context_id: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  is_my_day: z.boolean().default(false),
  checklists: z.array(z.string()).optional(),
});

export const UpdateTaskStatusSchema = z.object({
  store_id: z.string().uuid(),
  task_id: z.string().uuid(),
  status: TaskStatusEnum,
});

export const ToggleMyDaySchema = z.object({
  store_id: z.string().uuid(),
  task_id: z.string().uuid(),
  is_my_day: z.boolean(),
});

export const UpdateTaskInputSchema = z.object({
  store_id: z.string().uuid(),
  task_id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  priority: TaskPriorityEnum.optional(),
  due_date: z.string().optional().nullable(),
  assigned_to_profile_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  is_my_day: z.boolean().optional(),
});

export const ChecklistActionSchema = z.object({
  store_id: z.string().uuid(),
  task_id: z.string().uuid(),
  checklist_id: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  is_completed: z.boolean().optional(),
});

export const AddCommentSchema = z.object({
  store_id: z.string().uuid(),
  task_id: z.string().uuid(),
  comment_text: z.string().min(1, "Comentário não pode ser vazio"),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listWorkspaceTasks = createServerFn({ method: "GET" })
  .validator((d: { store_id: string; view?: string; search?: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    let query = db
      .from("workspace_tasks")
      .select(`
        id, store_id, title, description, priority, status, due_date, completed_at,
        context_type, context_id, tags, is_my_day, sort_order, created_at, updated_at,
        assigned_to_profile_id,
        workspace_task_checklists ( id, title, is_completed, sort_order ),
        workspace_task_comments ( id )
      `)
      .eq("store_id", data.store_id)
      .neq("status", "archived")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (data.view === "my-day") {
      query = query.eq("is_my_day", true);
    }

    if (data.search && data.search.trim()) {
      query = query.ilike("title", `%${data.search.trim()}%`);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;
    return tasks || [];
  });

export const getTaskDetails = createServerFn({ method: "GET" })
  .validator((d: { store_id: string; task_id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: task, error } = await db
      .from("workspace_tasks")
      .select(`
        *,
        workspace_task_checklists ( id, title, is_completed, sort_order, created_at ),
        workspace_task_comments ( id, comment_text, created_at, author_profile_id )
      `)
      .eq("id", data.task_id)
      .eq("store_id", data.store_id)
      .single();

    if (error) throw error;
    return task;
  });

export const createWorkspaceTask = createServerFn({ method: "POST" })
  .validator((d: unknown) => CreateTaskInputSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();

    const { data: created, error } = await db
      .from("workspace_tasks")
      .insert({
        store_id: data.store_id,
        created_by_profile_id: identity.id,
        assigned_to_profile_id: data.assigned_to_profile_id || null,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        context_type: data.context_type,
        context_id: data.context_id || null,
        tags: data.tags,
        is_my_day: data.is_my_day,
      })
      .select()
      .single();

    if (error) throw error;

    // Inserir checklists se houver
    if (data.checklists && data.checklists.length > 0) {
      const items = data.checklists
        .filter((c) => c.trim().length > 0)
        .map((title, idx) => ({
          task_id: created.id,
          title: title.trim(),
          sort_order: idx,
        }));

      if (items.length > 0) {
        await db.from("workspace_task_checklists").insert(items);
      }
    }

    return created;
  });

export const updateTaskStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpdateTaskStatusSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const completed_at = data.status === "done" ? new Date().toISOString() : null;

    const { data: updated, error } = await db
      .from("workspace_tasks")
      .update({
        status: data.status,
        completed_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.task_id)
      .eq("store_id", data.store_id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const toggleTaskMyDay = createServerFn({ method: "POST" })
  .validator((d: unknown) => ToggleMyDaySchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: updated, error } = await db
      .from("workspace_tasks")
      .update({
        is_my_day: data.is_my_day,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.task_id)
      .eq("store_id", data.store_id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const updateWorkspaceTask = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpdateTaskInputSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.due_date !== undefined) {
      updatePayload.due_date = data.due_date ? new Date(data.due_date).toISOString() : null;
    }
    if (data.assigned_to_profile_id !== undefined) {
      updatePayload.assigned_to_profile_id = data.assigned_to_profile_id;
    }
    if (data.tags !== undefined) updatePayload.tags = data.tags;
    if (data.is_my_day !== undefined) updatePayload.is_my_day = data.is_my_day;

    const { data: updated, error } = await db
      .from("workspace_tasks")
      .update(updatePayload)
      .eq("id", data.task_id)
      .eq("store_id", data.store_id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const deleteWorkspaceTask = createServerFn({ method: "POST" })
  .validator((d: { store_id: string; task_id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { error } = await db
      .from("workspace_tasks")
      .delete()
      .eq("id", data.task_id)
      .eq("store_id", data.store_id);

    if (error) throw error;
    return { success: true };
  });

export const toggleChecklistItem = createServerFn({ method: "POST" })
  .validator((d: unknown) => ChecklistActionSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    if (!data.checklist_id || data.is_completed === undefined) {
      throw new Error("Parâmetros inválidos para checklist");
    }

    const db = getServerClient();
    const { data: updated, error } = await db
      .from("workspace_task_checklists")
      .update({ is_completed: data.is_completed })
      .eq("id", data.checklist_id)
      .eq("task_id", data.task_id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const addChecklistItem = createServerFn({ method: "POST" })
  .validator((d: unknown) => ChecklistActionSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    if (!data.title) {
      throw new Error("Título do checklist é obrigatório");
    }

    const db = getServerClient();
    const { data: created, error } = await db
      .from("workspace_task_checklists")
      .insert({
        task_id: data.task_id,
        title: data.title.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  });

export const addTaskComment = createServerFn({ method: "POST" })
  .validator((d: unknown) => AddCommentSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: created, error } = await db
      .from("workspace_task_comments")
      .insert({
        task_id: data.task_id,
        author_profile_id: identity.id,
        comment_text: data.comment_text.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  });

export const getDailyTaskDigest = createServerFn({ method: "GET" })
  .validator((d: { store_id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const { data: tasks, error } = await db
      .from("workspace_tasks")
      .select("id, status, priority, due_date, is_my_day, completed_at")
      .eq("store_id", data.store_id)
      .neq("status", "archived");

    if (error) throw error;

    const all = tasks || [];
    const myDayCount = all.filter((t) => t.is_my_day && t.status !== "done").length;
    const pendingCount = all.filter((t) => t.status !== "done").length;
    const completedTodayCount = all.filter(
      (t) => t.status === "done" && t.completed_at && t.completed_at >= startOfToday,
    ).length;
    const urgentCount = all.filter(
      (t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "done",
    ).length;
    const overdueCount = all.filter(
      (t) => t.status !== "done" && t.due_date && t.due_date < startOfToday,
    ).length;

    return {
      myDayCount,
      pendingCount,
      completedTodayCount,
      urgentCount,
      overdueCount,
      totalCount: all.length,
    };
  });
