-- Create investments table with user isolation
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Saham', 'Emas', 'Reksadana')),
  monthly_contribution INTEGER NOT NULL CHECK (monthly_contribution > 0),
  current_value INTEGER NOT NULL CHECK (current_value > 0),
  purchase_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance (created BEFORE RLS as per Phase 3 decision)
CREATE INDEX investments_user_id_idx ON investments(user_id);
CREATE INDEX investments_category_idx ON investments(category);
CREATE INDEX investments_user_category_idx ON investments(user_id, category);
CREATE INDEX investments_user_id_created_at_idx ON investments(user_id, created_at DESC);

-- Enable Row-Level Security
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own investments
CREATE POLICY "Users can view their own investments"
  ON investments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can insert only their own investments
CREATE POLICY "Users can insert their own investments"
  ON investments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can update only their own investments
CREATE POLICY "Users can update their own investments"
  ON investments
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can delete only their own investments
CREATE POLICY "Users can delete their own investments"
  ON investments
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );
