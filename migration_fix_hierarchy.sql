-- Run this in your Supabase SQL Editor if you haven't already!

-- 1. Add new columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referrer_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS category text DEFAULT 'standard';

-- 2. Update RLS policies to ensure robust access
-- Allow users to read their own profile and profiles of their downline (simplified to public for now)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Allow users to insert their own profile (Critical for Sign Up)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
