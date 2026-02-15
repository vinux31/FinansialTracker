-- Create transactions table with user isolation
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Indexes for performance
  CONSTRAINT valid_expense_category CHECK (
    type = 'income' OR category IN ('Makan', 'Transportasi', 'Rokok', 'Belanja', 'Lainnya')
  ),
  CONSTRAINT valid_income_category CHECK (
    type = 'expense' OR category = 'Income'
  )
);

-- Index on user_id for RLS performance (critical for multi-user queries)
CREATE INDEX transactions_user_id_idx ON transactions(user_id);

-- Index on date for monthly aggregations
CREATE INDEX transactions_date_idx ON transactions(date);

-- Index on timestamp for sorting
CREATE INDEX transactions_timestamp_idx ON transactions(timestamp DESC);

-- Index on user_id + date for combined queries
CREATE INDEX transactions_user_date_idx ON transactions(user_id, date DESC);
