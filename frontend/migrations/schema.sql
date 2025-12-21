-- SUPABASE SCHEMA MIGRATION SCRIPT
-- Run this in the Supabase SQL Editor

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create User Profiles Table (Extends auth.users)
create table public.user_profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  role text default 'user' check (role in ('user', 'admin')),
  status text default 'active' check (status in ('active', 'disabled')),
  last_login timestamptz,
  tariff_settings jsonb default '{"rate": 1444.70, "currency": "IDR"}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- 3. Create Electricity Readings Table
create table public.electricity_readings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  date date not null,
  kwh_value numeric(10, 2) not null check (kwh_value >= 0),
  meter_photo_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.electricity_readings enable row level security;

-- 4. Create CMS Content Table
create table public.cms_content (
  section_id text primary key, -- e.g., 'hero', 'features', 'footer'
  content jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  is_published boolean default false,
  version integer default 1
);

-- Enable RLS
alter table public.cms_content enable row level security;

-- 5. RLS Policies

-- User Profiles Policies
create policy "Public profiles are viewable by everyone"
  on public.user_profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.user_profiles for update
  using ( auth.uid() = id );

create policy "Admins can delete user profiles"
  on public.user_profiles for delete
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Electricity Readings Policies
create policy "Users can view their own readings"
  on public.electricity_readings for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own readings"
  on public.electricity_readings for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own readings"
  on public.electricity_readings for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own readings"
  on public.electricity_readings for delete
  using ( auth.uid() = user_id );

-- CMS Content Policies
create policy "Anyone can view published content"
  on public.cms_content for select
  using ( is_published = true );

create policy "Admins can view all content including drafts"
  on public.cms_content for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert/update content"
  on public.cms_content for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 6. Storage Policies (For reference - apply in Storage UI)
-- Bucket: 'meter-photos'
-- Policy: Give users SELECT, INSERT, UPDATE, DELETE on objects where name starts with their user_id

-- 7. Functions and Triggers

-- Trigger to create user_profile on signup
-- Updated to handle OAuth users and prevent conflicts
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name, role, status)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1),
      'User'
    ),
    'user', -- Default role
    'active' -- Default status
  )
  on conflict (id) do update
  set 
    display_name = coalesce(
      excluded.display_name,
      user_profiles.display_name,
      coalesce(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
      )
    ),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for updating 'updated_at' timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at
    before update on public.user_profiles
    for each row
    execute function update_updated_at_column();

create trigger update_cms_content_updated_at
    before update on public.cms_content
    for each row
    execute function update_updated_at_column();
