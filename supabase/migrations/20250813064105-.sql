-- 1) Add input_cost_deduction column to cattle_transactions for sell transactions
ALTER TABLE public.cattle_transactions
ADD COLUMN IF NOT EXISTS input_cost_deduction numeric NOT NULL DEFAULT 0;

-- 2) Create sale_batch_allocations table to allocate a sale across multiple purchase batches
CREATE TABLE IF NOT EXISTS public.sale_batch_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sale_transaction_id uuid NOT NULL,
  purchase_transaction_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  cost_per_head numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_sale_txn FOREIGN KEY (sale_transaction_id) REFERENCES public.cattle_transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchase_txn FOREIGN KEY (purchase_transaction_id) REFERENCES public.cattle_transactions(id) ON DELETE RESTRICT
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sale_alloc_user ON public.sale_batch_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_alloc_sale ON public.sale_batch_allocations(sale_transaction_id);
CREATE INDEX IF NOT EXISTS idx_sale_alloc_purchase ON public.sale_batch_allocations(purchase_transaction_id);

-- Enable RLS and add policies mirroring cattle_transactions
ALTER TABLE public.sale_batch_allocations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sale_batch_allocations' AND policyname = 'Users can view their sale allocations'
  ) THEN
    CREATE POLICY "Users can view their sale allocations"
    ON public.sale_batch_allocations
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sale_batch_allocations' AND policyname = 'Users can insert their sale allocations'
  ) THEN
    CREATE POLICY "Users can insert their sale allocations"
    ON public.sale_batch_allocations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sale_batch_allocations' AND policyname = 'Users can update their sale allocations'
  ) THEN
    CREATE POLICY "Users can update their sale allocations"
    ON public.sale_batch_allocations
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sale_batch_allocations' AND policyname = 'Users can delete their sale allocations'
  ) THEN
    CREATE POLICY "Users can delete their sale allocations"
    ON public.sale_batch_allocations
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Trigger to maintain updated_at
DROP TRIGGER IF EXISTS update_sale_batch_allocations_updated_at ON public.sale_batch_allocations;
CREATE TRIGGER update_sale_batch_allocations_updated_at
BEFORE UPDATE ON public.sale_batch_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();