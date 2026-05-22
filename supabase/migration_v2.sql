-- ROI model columns
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS annual_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS implementation_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_annual_benefit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_level integer DEFAULT 70,
  ADD COLUMN IF NOT EXISTS time_to_value_months integer DEFAULT 12;

-- Computed columns (stored, queryable)
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS three_year_value numeric GENERATED ALWAYS AS (
    (expected_annual_benefit - annual_cost) * 3 - implementation_cost
  ) STORED;

ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS confidence_adjusted_roi numeric GENERATED ALWAYS AS (
    ((expected_annual_benefit - annual_cost) * 3 - implementation_cost) * confidence_level / 100.0
  ) STORED;

ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS payback_period_months numeric GENERATED ALWAYS AS (
    CASE
      WHEN (expected_annual_benefit - annual_cost) > 0
      THEN ROUND((implementation_cost / (expected_annual_benefit - annual_cost) * 12)::numeric, 1)
      ELSE NULL
    END
  ) STORED;
