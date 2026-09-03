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
  tags: string[];
  is_my_day: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  workspace_task_checklists?: TaskChecklistItem[];
  workspace_task_comments?: Array<{ id: string }>;
}

export interface DailyTaskDigest {
  myDayCount: number;
  pendingCount: number;
  completedTodayCount: number;
  urgentCount: number;
  overdueCount: number;
  totalCount: number;
}
