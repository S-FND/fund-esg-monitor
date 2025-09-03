-- Add access control fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN is_approved boolean NOT NULL DEFAULT false,
ADD COLUMN is_demo boolean NOT NULL DEFAULT false,
ADD COLUMN approval_requested_at timestamp with time zone,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid,
ADD COLUMN access_notes text;

-- Update existing demo tenants to be approved and marked as demo
UPDATE public.tenants 
SET is_approved = true, is_demo = true, approved_at = now()
WHERE name IN ('Fandoro Demo Fund', 'Fandoro Analytics', 'Fandoro Admin');