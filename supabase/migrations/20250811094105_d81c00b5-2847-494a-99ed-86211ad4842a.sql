-- Add batch tracking to cattle transactions
ALTER TABLE public.cattle_transactions 
ADD COLUMN batch_id UUID;

-- For existing buy transactions, set their batch_id to their own id
UPDATE public.cattle_transactions 
SET batch_id = id 
WHERE type = 'buy';

-- Create a view to track available batches with remaining cattle
CREATE OR REPLACE VIEW public.available_batches AS
SELECT 
  buy_tx.id as batch_id,
  buy_tx.occurred_on as purchase_date,
  buy_tx.breed,
  buy_tx.quantity as purchased_quantity,
  buy_tx.price_per_head,
  buy_tx.average_weight_kg,
  buy_tx.notes as purchase_notes,
  COALESCE(SUM(sell_tx.quantity), 0) as sold_quantity,
  buy_tx.quantity - COALESCE(SUM(sell_tx.quantity), 0) as remaining_quantity
FROM 
  public.cattle_transactions buy_tx
LEFT JOIN 
  public.cattle_transactions sell_tx ON sell_tx.batch_id = buy_tx.id AND sell_tx.type = 'sell'
WHERE 
  buy_tx.type = 'buy' 
  AND buy_tx.user_id = auth.uid()
GROUP BY 
  buy_tx.id, buy_tx.occurred_on, buy_tx.breed, buy_tx.quantity, 
  buy_tx.price_per_head, buy_tx.average_weight_kg, buy_tx.notes
HAVING 
  buy_tx.quantity - COALESCE(SUM(sell_tx.quantity), 0) > 0;

-- Create RLS policy for the view
CREATE POLICY "Users can view their available batches" 
ON public.cattle_transactions 
FOR SELECT 
USING (auth.uid() = user_id);