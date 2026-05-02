
-- Subscription plans (admin-managed catalog)
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_etb integer NOT NULL,
  credits integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  highlight boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active plans"
  ON public.subscription_plans FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert plans"
  ON public.subscription_plans FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update plans"
  ON public.subscription_plans FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete plans"
  ON public.subscription_plans FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payments
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled');

CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  tx_ref text NOT NULL UNIQUE,
  chapa_ref text,
  amount_etb integer NOT NULL,
  credits_awarded integer NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'pending',
  checkout_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_payments_user ON public.subscription_payments(user_id);
CREATE INDEX idx_subscription_payments_status ON public.subscription_payments(status);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.subscription_payments FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own payments"
  ON public.subscription_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update payments"
  ON public.subscription_payments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default tiers
INSERT INTO public.subscription_plans (slug, name, description, price_etb, credits, sort_order, highlight) VALUES
  ('starter', 'Starter', 'Best for trying paid features. ~500 minutes of transcription.', 500, 500, 1, false),
  ('pro', 'Pro', 'Most popular. Priority processing for power users.', 1500, 2000, 2, true),
  ('business', 'Business', 'For teams and high-volume needs. All features unlocked.', 4000, 6000, 3, false);
