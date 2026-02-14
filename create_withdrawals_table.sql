-- Create withdrawals table
create table public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) not null,
  amount numeric not null,
  proof_url text, -- URL to storage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.withdrawals enable row level security;

-- Policies
create policy "Withdrawals viewable by everyone" on public.withdrawals for select using (true);
create policy "Members can insert withdrawals" on public.withdrawals for insert with check (auth.uid() = member_id);
