-- =============================================
-- FIRMY KLIENTOV
-- Spustiť v Supabase SQL Editor
-- =============================================

-- 1. Tabuľka companies
CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  ico text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Klient vidí svoje, admin všetky
CREATE POLICY "Users can view companies" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Clients can insert own companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete own companies" ON public.companies
  FOR DELETE USING (auth.uid() = client_id);

CREATE POLICY "Clients can update own companies" ON public.companies
  FOR UPDATE USING (auth.uid() = client_id);

-- 2. Pridať company_id do documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
