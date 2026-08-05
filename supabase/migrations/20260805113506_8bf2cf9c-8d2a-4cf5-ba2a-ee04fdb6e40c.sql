ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS login_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date;