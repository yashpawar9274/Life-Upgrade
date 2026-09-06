CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  plan_code TEXT NOT NULL,
  interval TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'cashfree',
  cashfree_subscription_id TEXT,
  cashfree_order_id TEXT,
  cashfree_payment_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX subscriptions_cf_sub_id_key ON public.subscriptions (cashfree_subscription_id) WHERE cashfree_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX subscriptions_cf_order_id_key ON public.subscriptions (cashfree_order_id) WHERE cashfree_order_id IS NOT NULL;
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions (user_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscriptions select" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.current_plan()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.premium_members pm
      WHERE lower(pm.email) = lower(coalesce(
        (auth.jwt() ->> 'email'),
        (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
      ))
    ) THEN 'premium'
    WHEN EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.user_id = auth.uid()
        AND s.status IN ('active', 'authorized', 'paid')
        AND (s.plan_code = 'lifetime' OR s.current_period_end IS NULL OR s.current_period_end > now())
    ) THEN 'premium'
    ELSE 'free'
  END
$function$;
