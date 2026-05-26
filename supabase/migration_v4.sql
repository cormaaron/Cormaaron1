-- Strategy documents
CREATE TABLE IF NOT EXISTS strategy_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  doc_type text DEFAULT 'strategy' CHECK (doc_type IN ('strategy','pmo','memo','other')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE strategy_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own docs" ON strategy_docs
  FOR ALL USING (auth.uid() = user_id);

-- Portfolio snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  initiative_count integer NOT NULL DEFAULT 0,
  active_count integer NOT NULL DEFAULT 0,
  avg_score numeric NOT NULL DEFAULT 0,
  total_budget numeric NOT NULL DEFAULT 0,
  total_conf_adj_roi numeric NOT NULL DEFAULT 0,
  at_risk_count integer NOT NULL DEFAULT 0,
  accelerate_count integer NOT NULL DEFAULT 0,
  stop_count integer NOT NULL DEFAULT 0,
  watch_count integer NOT NULL DEFAULT 0
);
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own snapshots" ON portfolio_snapshots
  FOR ALL USING (auth.uid() = user_id);
