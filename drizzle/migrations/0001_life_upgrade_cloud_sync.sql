CREATE TABLE public.user_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  routines jsonb NOT NULL DEFAULT '[]'::jsonb,
  habits jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '[]'::jsonb,
  roadmap jsonb NOT NULL DEFAULT '{}'::jsonb,
  chat jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_config TO authenticated;
GRANT ALL ON public.user_config TO service_role;

ALTER TABLE public.user_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own config select" ON public.user_config FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own config insert" ON public.user_config FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own config update" ON public.user_config FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own config delete" ON public.user_config FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.daily_logs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  routine_done text[] NOT NULL DEFAULT '{}',
  habit_done text[] NOT NULL DEFAULT '{}',
  limit_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  mood text,
  focus_minutes integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own logs select" ON public.daily_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own logs insert" ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs update" ON public.daily_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs delete" ON public.daily_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX daily_logs_user_day_idx ON public.daily_logs (user_id, day DESC);