CREATE TABLE public.chest_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  item_key text NOT NULL,
  item_label text NOT NULL,
  reward_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  opened boolean NOT NULL DEFAULT false,
  stars_awarded integer NOT NULL DEFAULT 0,
  golden_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz
);

GRANT ALL ON public.chest_grants TO service_role;

ALTER TABLE public.chest_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block direct reads chest_grants" ON public.chest_grants FOR SELECT USING (false);
CREATE POLICY "block direct inserts chest_grants" ON public.chest_grants FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct updates chest_grants" ON public.chest_grants FOR UPDATE USING (false);
CREATE POLICY "block direct deletes chest_grants" ON public.chest_grants FOR DELETE USING (false);

CREATE INDEX idx_chest_grants_username ON public.chest_grants (username);