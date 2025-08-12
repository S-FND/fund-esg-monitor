-- Create demo user profiles using the correct user_role enum values
-- These will be the profiles for our demo users

-- Create demo user profiles with known UUIDs that we'll use when creating auth users
INSERT INTO public.profiles (user_id, email, full_name, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'support@fandoro.com', 'Fund Admin', 'investor_admin', true),
  ('22222222-2222-2222-2222-222222222222', 'team.editor@fandoro.com', 'Team Editor', 'team_member_editor', true),
  ('33333333-3333-3333-3333-333333333333', 'team.readonly@fandoro.com', 'Team Reader', 'team_member_readonly', true),
  ('44444444-4444-4444-4444-444444444444', 'auditor@fandoro.com', 'Auditor', 'auditor', true)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;