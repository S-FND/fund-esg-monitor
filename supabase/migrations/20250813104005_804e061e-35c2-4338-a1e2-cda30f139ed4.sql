-- Create a function to manually confirm users for demo purposes
CREATE OR REPLACE FUNCTION confirm_demo_user(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_val uuid;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO user_id_val
  FROM auth.users
  WHERE email = user_email
  AND email_confirmed_at IS NULL;
  
  IF user_id_val IS NOT NULL THEN
    -- Confirm the user's email
    UPDATE auth.users
    SET 
      email_confirmed_at = now(),
      confirmed_at = now()
    WHERE id = user_id_val;
  END IF;
END;
$$;