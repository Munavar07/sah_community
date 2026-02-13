-- Create tables for the Trading Network App

-- Profiles table (extends auth.users if using Auth, but we'll keep it simple for now)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  role text check (role in ('leader', 'member')) default 'member',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Investments table
create table public.investments (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) not null,
  amount numeric not null,
  proof_url text, -- URL to storage
  status text check (status in ('pending', 'active', 'completed')) default 'pending',
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Logs table
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) not null,
  profit_amount numeric not null,
  screenshot_url text, -- URL to storage
  log_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.investments enable row level security;
alter table public.daily_logs enable row level security;

-- Policies (Simplified for MVP - allow public read/write if you want, but better to be safe)
-- For now, we will allow authenticated users to do everything for simplicity in testing
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Investments viewable by everyone" on public.investments for select using (true);
create policy "Members can insert investments" on public.investments for insert with check (auth.uid() = member_id);

create policy "Logs viewable by everyone" on public.daily_logs for select using (true);
create policy "Members can insert logs" on public.daily_logs for insert with check (auth.uid() = member_id);

-- Commissions table
create table public.commissions (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.profiles(id) not null,
  member_id uuid references public.profiles(id) not null,
  amount numeric not null,
  type text default 'referral',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.commissions enable row level security;
create policy "Commissions viewable by everyone" on public.commissions for select using (true);

-- Storage buckets
-- You will need to create 'proofs' and 'results' buckets in the Supabase Storage UI.
