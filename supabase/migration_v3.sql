-- Org context fields on initiatives
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS business_unit text,
  ADD COLUMN IF NOT EXISTS strategic_objective text;

-- Portfolio challenge results
CREATE TABLE IF NOT EXISTS portfolio_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  content jsonb NOT NULL
);
ALTER TABLE portfolio_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own challenges" ON portfolio_challenges
  FOR ALL USING (auth.uid() = user_id);

-- Strategy memory / decision log
CREATE TABLE IF NOT EXISTS strategy_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  decision_type text NOT NULL CHECK (decision_type IN ('approved','rejected','deferred','noted')),
  title text NOT NULL,
  rationale text,
  initiative_names text[] DEFAULT '{}'
);
ALTER TABLE strategy_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own decisions" ON strategy_decisions
  FOR ALL USING (auth.uid() = user_id);
