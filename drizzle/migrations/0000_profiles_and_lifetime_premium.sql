-- Profiles for signed-in users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Lifetime premium grants (server-managed, not user writable)
CREATE TABLE public.premium_members (
  email text PRIMARY KEY,
  lifetime boolean NOT NULL DEFAULT true,
  granted_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.premium_members TO service_role;

ALTER TABLE public.premium_members ENABLE ROW LEVEL SECURITY;

INSERT INTO public.premium_members (email, lifetime)
VALUES ('theyashpawar92@gmail.com', true)
ON CONFLICT (email) DO NOTHING;

-- Plan lookup for the current user (bypasses RLS on premium_members)
CREATE OR REPLACE FUNCTION public.current_plan()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.premium_members pm
      WHERE lower(pm.email) = lower(coalesce(
        (auth.jwt() ->> 'email'),
        (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
      ))
    ) THEN 'premium'
    ELSE 'free'
  END
$$;

GRANT EXECUTE ON FUNCTION public.current_plan() TO authenticated;
