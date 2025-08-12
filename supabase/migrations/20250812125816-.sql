-- Create demo users for the application
-- Note: This creates the profiles and any necessary user data, but actual auth users need to be created via Supabase auth

-- First, let's check if we have a profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  tenant_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create demo user profiles with known UUIDs that we'll use when creating auth users
-- These UUIDs will be used when manually creating the auth users
INSERT INTO public.profiles (user_id, email, full_name, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'support@fandoro.com', 'Fund Admin', 'admin', true),
  ('22222222-2222-2222-2222-222222222222', 'team.editor@fandoro.com', 'Team Editor', 'editor', true),
  ('33333333-3333-3333-3333-333333333333', 'team.readonly@fandoro.com', 'Team Reader', 'viewer', true),
  ('44444444-4444-4444-4444-444444444444', 'auditor@fandoro.com', 'Auditor', 'auditor', true)
ON CONFLICT (user_id) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();