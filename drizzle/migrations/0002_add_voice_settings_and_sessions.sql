ALTER TABLE public.user_config
  ADD COLUMN IF NOT EXISTS voice_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_sessions JSONB NOT NULL DEFAULT '[]'::jsonb;