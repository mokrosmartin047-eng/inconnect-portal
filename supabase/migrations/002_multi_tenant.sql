-- =============================================
-- MULTI-TENANT MIGRÁCIA
-- Spustiť v Supabase SQL Editor
-- =============================================

-- 1. Profiles — pridať GDPR súhlas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gdpr_accepted_at timestamptz;

-- 2. Messages — pridať client_id (ku ktorému klientovi patrí konverzácia)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.profiles(id);

-- Nastaviť existujúce správy — ak existujú, priradiť prvému klientovi
UPDATE public.messages SET client_id = (
  SELECT id FROM public.profiles WHERE role = 'client' LIMIT 1
) WHERE client_id IS NULL;

-- 3. Documents — pridať client_id a month
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS month text;

-- Nastaviť existujúce dokumenty
UPDATE public.documents SET client_id = (
  SELECT id FROM public.profiles WHERE role = 'client' LIMIT 1
) WHERE client_id IS NULL;

UPDATE public.documents SET month = to_char(created_at, 'YYYY-MM') WHERE month IS NULL;

-- =============================================
-- NOVÉ RLS POLITIKY — izolácia dát
-- =============================================

-- Helper funkcia: zistí rolu aktuálneho usera
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- === MESSAGES RLS ===
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark as read" ON public.messages;

-- Admin vidí všetky správy, klient len svoje
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (
    public.get_user_role() = 'accountant'
    OR client_id = auth.uid()
  );

-- Admin môže posielať správy komukoľvek, klient len do svojej konverzácie
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
      public.get_user_role() = 'accountant'
      OR client_id = auth.uid()
    )
  );

-- Ktokoľvek autentifikovaný môže označiť ako prečítané
CREATE POLICY "Users can mark messages read" ON public.messages
  FOR UPDATE USING (
    public.get_user_role() = 'accountant'
    OR client_id = auth.uid()
  );

-- === DOCUMENTS RLS ===
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Uploaders can delete own documents" ON public.documents;

-- Admin vidí všetky dokumenty, klient len svoje
CREATE POLICY "Users can view documents" ON public.documents
  FOR SELECT USING (
    public.get_user_role() = 'accountant'
    OR client_id = auth.uid()
  );

-- Upload: admin pre hocikoho, klient len pre seba
CREATE POLICY "Users can upload documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND (
      public.get_user_role() = 'accountant'
      OR client_id = auth.uid()
    )
  );

-- Mazanie: len vlastné
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = uploaded_by);

-- === PROFILES RLS — update pre GDPR ===
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
