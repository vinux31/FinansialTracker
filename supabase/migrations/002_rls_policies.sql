-- Enable Row-Level Security on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can insert only their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can update only their own transactions
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can delete only their own transactions
CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
  );
