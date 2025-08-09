-- Create tables for cattle transactions and input costs with per-user RLS
-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cattle transactions table
CREATE TABLE IF NOT EXISTS public.cattle_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occurred_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  type text NOT NULL CHECK (type IN ('buy','sell')),
  quantity integer NOT NULL CHECK (quantity > 0),
  price_per_head numeric(12,2) NOT NULL CHECK (price_per_head >= 0),
  total_amount numeric(12,2) NOT NULL,
  breed text,
  average_weight_kg numeric(10,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cattle_transactions_user_id ON public.cattle_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cattle_transactions_occurred_on ON public.cattle_transactions(occurred_on);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_cattle_transactions_updated_at ON public.cattle_transactions;
CREATE TRIGGER trg_cattle_transactions_updated_at
BEFORE UPDATE ON public.cattle_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Input costs table
CREATE TABLE IF NOT EXISTS public.input_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occurred_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  category text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_input_costs_user_id ON public.input_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_input_costs_occurred_on ON public.input_costs(occurred_on);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_input_costs_updated_at ON public.input_costs;
CREATE TRIGGER trg_input_costs_updated_at
BEFORE UPDATE ON public.input_costs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.cattle_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.input_costs ENABLE ROW LEVEL SECURITY;

-- Policies: each user can CRUD only their own rows
DROP POLICY IF EXISTS "Users can view their cattle transactions" ON public.cattle_transactions;
CREATE POLICY "Users can view their cattle transactions"
ON public.cattle_transactions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their cattle transactions" ON public.cattle_transactions;
CREATE POLICY "Users can insert their cattle transactions"
ON public.cattle_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their cattle transactions" ON public.cattle_transactions;
CREATE POLICY "Users can update their cattle transactions"
ON public.cattle_transactions
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their cattle transactions" ON public.cattle_transactions;
CREATE POLICY "Users can delete their cattle transactions"
ON public.cattle_transactions
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their input costs" ON public.input_costs;
CREATE POLICY "Users can view their input costs"
ON public.input_costs
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their input costs" ON public.input_costs;
CREATE POLICY "Users can insert their input costs"
ON public.input_costs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their input costs" ON public.input_costs;
CREATE POLICY "Users can update their input costs"
ON public.input_costs
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their input costs" ON public.input_costs;
CREATE POLICY "Users can delete their input costs"
ON public.input_costs
FOR DELETE
USING (auth.uid() = user_id);
