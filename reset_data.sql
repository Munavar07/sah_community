-- DANGER: This will delete ALL data from your application tables!
-- Run this in the Supabase SQL Editor.

-- 1. Truncate tables (Cascading to delete related data)
TRUNCATE TABLE public.commissions CASCADE;
TRUNCATE TABLE public.daily_logs CASCADE;
TRUNCATE TABLE public.investments CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Note: This does NOT delete the Auth Users (email/password logins). 
-- You MUST delete them manually from the Supabase Dashboard:
-- Go to Authentication -> Users -> Select All -> Delete.
