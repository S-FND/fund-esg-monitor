-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'investor_admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create policies for tenants
CREATE POLICY "Users can view their own tenant" 
ON public.tenants 
FOR SELECT 
USING (id IN (
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Update the handle_new_user function to create profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  tenant_id_val UUID;
BEGIN
  -- Check if this is an invited team member
  SELECT tm.tenant_id INTO tenant_id_val
  FROM public.team_members tm
  WHERE tm.email = NEW.email AND tm.user_id IS NULL
  LIMIT 1;

  -- If found in team_members, update the invitation
  IF tenant_id_val IS NOT NULL THEN
    UPDATE public.team_members 
    SET user_id = NEW.id, accepted_at = now()
    WHERE email = NEW.email AND user_id IS NULL;
    
    -- Create profile for team member
    INSERT INTO public.profiles (user_id, tenant_id, email, full_name, role)
    VALUES (NEW.id, tenant_id_val, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'team_member');
  ELSE
    -- This is a new investor admin creating their own tenant
    INSERT INTO public.tenants (name, description)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Investor'),
      'Investor workspace'
    );
    
    -- Get the created tenant ID
    SELECT id INTO tenant_id_val FROM public.tenants ORDER BY created_at DESC LIMIT 1;
    
    -- Create profile for investor admin
    INSERT INTO public.profiles (user_id, tenant_id, email, full_name, role)
    VALUES (NEW.id, tenant_id_val, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'investor_admin');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();