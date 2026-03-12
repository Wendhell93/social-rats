
-- Create admin_emails table
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if an email is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = _email
  )
$$;

-- Anyone can read admin_emails (needed for AuthContext check)
CREATE POLICY "Anyone can read admin_emails"
  ON public.admin_emails FOR SELECT
  TO public
  USING (true);

-- Only authenticated admins can insert admin_emails
CREATE POLICY "Admins can insert admin_emails"
  ON public.admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_email(auth.jwt() ->> 'email'));

-- Only authenticated admins can delete admin_emails
CREATE POLICY "Admins can delete admin_emails"
  ON public.admin_emails FOR DELETE
  TO authenticated
  USING (public.is_admin_email(auth.jwt() ->> 'email'));
