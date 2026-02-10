
-- Add agent payment fields to order_payments table
ALTER TABLE public.order_payments
ADD COLUMN agent_payment_method text DEFAULT NULL,
ADD COLUMN agent_receipt_url text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.order_payments.agent_payment_method IS 'cash or transfer';
COMMENT ON COLUMN public.order_payments.agent_receipt_url IS 'Receipt URL for agent bank transfer payment';
