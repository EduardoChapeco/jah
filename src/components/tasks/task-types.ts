export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "archived";
export type TaskContextType =
  | "general"
  | "order"
  | "lead"
  | "group_tour"
  | "table"
  | "customer"
  | "inventory";

export interface TaskChecklistItem {
  id: string;
  task_id?: string;
  title: string;
  is_completed: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface TaskCommentItem {
  id: string;
  task_id?: string;
  author_profile_id?: string | null;
  comment_text: string;
  created_at: string;
}

export interface WorkspaceTask {
  id: string;
  store_id: string;
  task_code?: string;
  created_by_profile_id?: string | null;
  assigned_to_profile_id?: string | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  completed_at?: string | null;
  context_type: TaskContextType;
  context_id?: string | null;
  context_label?: string | null;
  tags: string[];
  is_my_day: boolean;
  sort_order?: number;
  timer_seconds?: number;
  timer_started_at?: string | null;
  is_timer_running?: boolean;
  estimated_minutes?: number;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "weekdays";
  custom_fields?: Record<string, any>;
  kanban_column_id?: string;
  created_at: string;
  updated_at: string;
  workspace_task_checklists?: TaskChecklistItem[];
  workspace_task_comments?: Array<{ id: string }>;
}

export interface WorkspaceTaskColumn {
  id: string;
  store_id: string;
  name: string;
  column_key: string;
  color: string;
  sort_order: number;
  limit_wip: number;
  is_done_column: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailyTaskDigest {
  myDayCount: number;
  pendingCount: number;
  completedTodayCount: number;
  urgentCount: number;
  overdueCount: number;
  totalCount: number;
}
