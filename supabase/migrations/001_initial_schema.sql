-- Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('accountant', 'client')),
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  file_url text,
  file_name text,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Authenticated users can view messages"
  on public.messages for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can mark as read"
  on public.messages for update
  using (auth.role() = 'authenticated');

-- Documents
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  file_path text not null,
  file_size bigint not null,
  file_type text not null,
  category text not null default 'other' check (category in ('invoice', 'contract', 'receipt', 'other')),
  uploaded_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table public.documents enable row level security;

create policy "Authenticated users can view documents"
  on public.documents for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can upload documents"
  on public.documents for insert
  with check (auth.uid() = uploaded_by);

create policy "Uploaders can delete own documents"
  on public.documents for delete
  using (auth.uid() = uploaded_by);

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.documents;

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

create policy "Authenticated users can upload files"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Authenticated users can view files"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Authenticated users can download files"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.role() = 'authenticated');
