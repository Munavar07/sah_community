-- Create the announcements table
create table if not exists public.announcements (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    type varchar(50) default 'info'::character varying, -- 'info', 'warning', 'success'
    is_active boolean default true,
    created_by uuid references public.profiles(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
alter table public.announcements enable row level security;

-- Create policies

-- 1. Everyone can view active announcements
create policy "Anyone can view active announcements"
    on public.announcements for select
    using (is_active = true);

-- 2. Only leaders can view inactive/all announcements
create policy "Leaders can view all announcements"
    on public.announcements for select
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'leader'
        )
    );

-- 3. Only leaders can insert/update/delete announcements
create policy "Leaders can insert announcements"
    on public.announcements for insert
    with check (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'leader'
        )
    );

create policy "Leaders can update announcements"
    on public.announcements for update
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'leader'
        )
    );

create policy "Leaders can delete announcements"
    on public.announcements for delete
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'leader'
        )
    );
