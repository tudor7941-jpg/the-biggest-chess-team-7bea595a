CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  stars integer NOT NULL DEFAULT 0,
  golden_stars integer NOT NULL DEFAULT 0,
  gave_up integer NOT NULL DEFAULT 0,
  xp integer NOT NULL DEFAULT 0,
  on_leaderboard boolean NOT NULL DEFAULT true,
  titles text[] NOT NULL DEFAULT '{}',
  auth_token uuid NOT NULL DEFAULT gen_random_uuid(),
  xp_bonus integer NOT NULL DEFAULT 0,
  claimed_achievements text[] NOT NULL DEFAULT '{}'::text[],
  claimed_milestones text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX app_users_auth_token_idx ON public.app_users(auth_token);
GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block direct reads app_users" ON public.app_users FOR SELECT USING (false);
CREATE POLICY "block direct writes" ON public.app_users FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct updates" ON public.app_users FOR UPDATE USING (false);
CREATE POLICY "block direct deletes" ON public.app_users FOR DELETE USING (false);

CREATE TABLE public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  item_key text NOT NULL,
  item_label text NOT NULL,
  cost integer NOT NULL,
  currency text NOT NULL CHECK (currency IN ('stars','golden')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','denied')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.purchase_requests TO service_role;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block direct reads purchase_requests" ON public.purchase_requests FOR SELECT USING (false);
CREATE POLICY "block direct writes" ON public.purchase_requests FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct updates" ON public.purchase_requests FOR UPDATE USING (false);
CREATE POLICY "block direct deletes" ON public.purchase_requests FOR DELETE USING (false);

CREATE TABLE public.daily_chest_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  claim_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  stars_awarded integer NOT NULL DEFAULT 0,
  golden_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (username, claim_date)
);
GRANT ALL ON public.daily_chest_claims TO service_role;
ALTER TABLE public.daily_chest_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block direct reads daily_chest_claims" ON public.daily_chest_claims FOR SELECT USING (false);
CREATE POLICY "block direct writes" ON public.daily_chest_claims FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct updates daily_chest_claims" ON public.daily_chest_claims FOR UPDATE USING (false);
CREATE POLICY "block direct deletes daily_chest_claims" ON public.daily_chest_claims FOR DELETE USING (false);

CREATE TABLE public.quiz_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  quiz_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  correct integer NOT NULL DEFAULT 0,
  stars_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (username, quiz_date)
);
GRANT ALL ON public.quiz_completions TO service_role;
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block direct reads quiz_completions" ON public.quiz_completions FOR SELECT USING (false);
CREATE POLICY "block direct writes" ON public.quiz_completions FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct updates quiz_completions" ON public.quiz_completions FOR UPDATE USING (false);
CREATE POLICY "block direct deletes quiz_completions" ON public.quiz_completions FOR DELETE USING (false);

CREATE TABLE public.shop_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  cost integer NOT NULL,
  currency text NOT NULL,
  kind text NOT NULL DEFAULT 'title',
  rarity text,
  is_daily boolean NOT NULL DEFAULT false,
  reward_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block direct writes shop_items ins" ON public.shop_items FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct writes shop_items upd" ON public.shop_items FOR UPDATE USING (false);
CREATE POLICY "block direct writes shop_items del" ON public.shop_items FOR DELETE USING (false);
CREATE POLICY "block direct reads shop_items" ON public.shop_items FOR SELECT USING (false);

CREATE TABLE public.marathon_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL,
  marathon_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc'::text))::date,
  correct integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  xp_awarded integer NOT NULL DEFAULT 0,
  stars_awarded integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (username, marathon_date)
);
GRANT ALL ON public.marathon_completions TO service_role;
ALTER TABLE public.marathon_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block direct writes marathon ins" ON public.marathon_completions FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct writes marathon upd" ON public.marathon_completions FOR UPDATE USING (false);
CREATE POLICY "block direct writes marathon del" ON public.marathon_completions FOR DELETE USING (false);
CREATE POLICY "block direct reads marathon" ON public.marathon_completions FOR SELECT USING (false);

CREATE TABLE public.news_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.news_posts TO service_role;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "block direct reads news_posts" ON public.news_posts FOR SELECT USING (false);
CREATE POLICY "block direct inserts news_posts" ON public.news_posts FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct updates news_posts" ON public.news_posts FOR UPDATE USING (false);
CREATE POLICY "block direct deletes news_posts" ON public.news_posts FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_news_posts_updated_at BEFORE UPDATE ON public.news_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.news_posts (title, body, pinned) VALUES
('Welcome to the team hub!', 'Check the "How to get stars?" tab to learn how tournament results turn into stars, and keep an eye on this News tab for announcements from the owner.', true);