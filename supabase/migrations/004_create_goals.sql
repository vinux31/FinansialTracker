-- Create goals table with user isolation
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  category TEXT NOT NULL CHECK (category IN ('Pernikahan', 'Kendaraan', 'Liburan', 'Pendidikan', 'Rumah', 'Dana Darurat', 'Lainnya')),
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  deadline DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'in-progress', 'completed', 'overdue')) DEFAULT 'upcoming',
  status_override TEXT CHECK (status_override IN ('upcoming', 'in-progress', 'completed', 'overdue') OR status_override IS NULL),
  funding_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create goal progress entries table
CREATE TABLE goal_progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  planned_amount INTEGER NOT NULL DEFAULT 0,
  actual_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_id, month)
);

-- Indexes for performance (created BEFORE RLS as per Phase 3 decision)
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_category ON goals(category);
CREATE INDEX idx_goals_deadline ON goals(deadline);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_progress_user_id ON goal_progress_entries(user_id);
CREATE INDEX idx_progress_goal_id ON goal_progress_entries(goal_id);
CREATE INDEX idx_progress_month ON goal_progress_entries(month);

-- Enable Row-Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_entries ENABLE ROW LEVEL SECURITY;

-- Goals table policies
CREATE POLICY "Users can view their own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Users can insert their own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Users can update their own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Users can delete their own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Goal progress entries table policies
CREATE POLICY "Users can view their own progress entries"
  ON goal_progress_entries
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Users can insert their own progress entries"
  ON goal_progress_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Users can update their own progress entries"
  ON goal_progress_entries
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Users can delete their own progress entries"
  ON goal_progress_entries
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );
