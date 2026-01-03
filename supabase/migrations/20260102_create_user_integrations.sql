create table if not exists public.user_integrations (
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb,
  primary key (user_id, provider)
);

alter table public.user_integrations enable row level security;

create policy "Users can view own integrations"
  on public.user_integrations for select
  using (auth.uid() = user_id);

create policy "Users can update own integrations"
  on public.user_integrations for update
  using (auth.uid() = user_id);

create policy "Users can insert own integrations"
  on public.user_integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own integrations"
  on public.user_integrations for delete
  using (auth.uid() = user_id);
