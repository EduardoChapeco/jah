-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Store Workflows & Automações Visuais
-- ══════════════════════════════════════════════════════════════════════════════

do $do$
begin
  if not exists (select 1 from pg_type where typname = 'workflow_status_enum') then
    create type workflow_status_enum as enum ('active', 'inactive', 'draft', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'workflow_trigger_type') then
    create type workflow_trigger_type as enum (
      'order_paid','order_created','order_cancelled','customer_created',
      'lead_created','lead_won','lead_lost','booking_confirmed',
      'booking_cancelled','cart_abandoned','product_low_stock','manual'
    );
  end if;
end
$do$;

create table if not exists store_workflows (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references stores(id) on delete cascade,
  title           text not null,
  description     text,
  trigger_type    workflow_trigger_type not null default 'manual',
  nodes           jsonb not null default '[]',
  edges           jsonb not null default '[]',
  status          workflow_status_enum not null default 'draft',
  execution_count integer not null default 0,
  last_run_at     timestamptz,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_store_workflows_store_id on store_workflows(store_id);
create index if not exists idx_store_workflows_status on store_workflows(store_id, status);

alter table store_workflows enable row level security;

drop policy if exists "store_workflows_select_own" on store_workflows;
create policy "store_workflows_select_own" on store_workflows for select
  using (store_id in (select store_id from workspace_members where profile_id = auth.uid() and role in ('owner','admin','manager','seller')));

drop policy if exists "store_workflows_insert_own" on store_workflows;
create policy "store_workflows_insert_own" on store_workflows for insert
  with check (store_id in (select store_id from workspace_members where profile_id = auth.uid() and role in ('owner','admin','manager')));

drop policy if exists "store_workflows_update_own" on store_workflows;
create policy "store_workflows_update_own" on store_workflows for update
  using (store_id in (select store_id from workspace_members where profile_id = auth.uid() and role in ('owner','admin','manager')));

drop policy if exists "store_workflows_delete_own" on store_workflows;
create policy "store_workflows_delete_own" on store_workflows for delete
  using (store_id in (select store_id from workspace_members where profile_id = auth.uid() and role in ('owner','admin')));

create or replace function update_store_workflows_updated_at()
returns trigger language plpgsql as $func$
begin new.updated_at = now(); return new; end;
$func$;

drop trigger if exists trg_store_workflows_updated_at on store_workflows;
create trigger trg_store_workflows_updated_at
  before update on store_workflows for each row
  execute function update_store_workflows_updated_at();

-- Execuções de workflows (log de auditoria)
create table if not exists store_workflow_executions (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid not null references store_workflows(id) on delete cascade,
  store_id     uuid not null references stores(id) on delete cascade,
  status       text not null default 'success' check (status in ('success','failed','partial')),
  trigger_data jsonb,
  result_data  jsonb,
  error_msg    text,
  executed_at  timestamptz not null default now()
);

create index if not exists idx_workflow_executions_workflow_id on store_workflow_executions(workflow_id);
alter table store_workflow_executions enable row level security;
drop policy if exists "workflow_executions_select_own" on store_workflow_executions;
create policy "workflow_executions_select_own" on store_workflow_executions for select
  using (store_id in (select store_id from workspace_members where profile_id = auth.uid() and role in ('owner','admin','manager')));
