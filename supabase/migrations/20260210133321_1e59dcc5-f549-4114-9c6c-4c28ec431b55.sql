
-- Create delivery agents table (managed by admin)
CREATE TABLE public.delivery_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_iban TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;

-- Everyone can read active agents
CREATE POLICY "Anyone can view delivery agents"
  ON public.delivery_agents FOR SELECT
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert delivery agents"
  ON public.delivery_agents FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update delivery agents"
  ON public.delivery_agents FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete delivery agents"
  ON public.delivery_agents FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add delivery agent columns to order_items
ALTER TABLE public.order_items ADD COLUMN delivery_type TEXT DEFAULT 'self';
ALTER TABLE public.order_items ADD COLUMN delivery_agent_id UUID REFERENCES public.delivery_agents(id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_agents;

-- Trigger for updated_at
CREATE TRIGGER update_delivery_agents_updated_at
  BEFORE UPDATE ON public.delivery_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
