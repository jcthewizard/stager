-- Stager Database Schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. Profiles table (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  credits integer default 5,
  total_credits_purchased integer default 0,
  plan text default 'free',
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- 2. Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    5  -- signup bonus
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. Enhancements table
-- ============================================================
create table if not exists public.enhancements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  original_url text not null,
  enhanced_urls text[] default '{}',
  model_used text,
  enhancement_type text,
  credits_used integer default 1,
  status text default 'pending',
  prompt text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.enhancements enable row level security;

create policy "Users can view own enhancements"
  on public.enhancements for select
  using (auth.uid() = user_id);

create policy "Users can create own enhancements"
  on public.enhancements for insert
  with check (auth.uid() = user_id);

create policy "Users can update own enhancements"
  on public.enhancements for update
  using (auth.uid() = user_id);

-- ============================================================
-- 4. Credit transactions ledger
-- ============================================================
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount integer not null,
  type text not null,
  description text,
  stripe_payment_id text,
  created_at timestamptz default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

create policy "Users can create own transactions"
  on public.credit_transactions for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 5. Storage bucket for photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own directory
create policy "Users can upload photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access to all photos
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'photos');
