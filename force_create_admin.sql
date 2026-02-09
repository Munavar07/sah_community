-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- 1. Insert into auth.users (The login account)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(), -- Generates a new unique ID
  'authenticated',
  'authenticated',
  'shahilbacker36@gmail.com',
  crypt('Apple@123%', gen_salt('bf')), -- Hashes the password 'Apple@123%'
  now(), -- Confirms email immediately
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING; -- If user exists, do nothing (we will update profile next)

-- 2. Insert into public.profiles (The app data)
-- We need to look up the ID we just inserted (or the existing one)
INSERT INTO public.profiles (id, email, full_name, role, category, created_at, updated_at)
SELECT 
  id, 
  email, 
  'Sahil Backer', 
  'leader', 
  'director', 
  now(), 
  now()
FROM auth.users 
WHERE email = 'shahilbacker36@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'leader', category = 'director';
