-- Add missing timestamp columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Re-run the column addition just in case (idempotent)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'director',
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id);
