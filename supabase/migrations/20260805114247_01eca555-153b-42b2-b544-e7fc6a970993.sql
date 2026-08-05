CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  is_owner boolean NOT NULL DEFAULT false,
  message text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  type text NOT NULL CHECK (type IN ('bug','update','improvement')),
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','completed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.news_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id text NOT NULL,
  username text NOT NULL,
  is_owner boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS news_reviews_news_id_idx ON public.news_reviews (news_id, created_at);
GRANT ALL ON public.news_reviews TO service_role;
ALTER TABLE public.news_reviews ENABLE ROW LEVEL SECURITY;