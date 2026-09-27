-- ==============================================================================
-- Migration: 2-Tier (Free & Pro) Pay-As-You-Go Credit System
-- Description:
--   1. Converts any legacy 'byok' profiles to 'free'
--   2. Updates 'user_plan' enum to ('free', 'pro')
--   3. Adds 'credits_balance' column with default 10 credits to 'profiles'
--   4. Creates 'credit_transactions' audit ledger
--   5. Creates atomic stored procedures 'deduct_credits' and 'add_credits'
--   6. Updates signup trigger to grant 10 welcome credits
-- ==============================================================================

-- Step 1: Normalize any existing 'byok' profiles to 'free'
UPDATE public.profiles
SET plan = 'free'::public.user_plan
WHERE plan::text = 'byok';

-- Step 2: Add credits_balance column to profiles (if not already added)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 10;

-- Ensure existing users have credits
UPDATE public.profiles
SET credits_balance = 10
WHERE credits_balance IS NULL OR credits_balance = 0;

-- Give existing pro users a generous credit buffer
UPDATE public.profiles
SET credits_balance = 150
WHERE plan::text = 'pro';

-- Step 3: Create credit_transactions audit table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL, -- Negative for deductions, positive for purchases/grants
    balance_after INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'welcome_bonus', 'cv_generation', 'auto_fix', 'docx_optimize', 'credit_purchase', 'admin_grant'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own credit transactions" 
    ON public.credit_transactions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all credit transactions" ON public.credit_transactions;
CREATE POLICY "Admins can view all credit transactions" 
    ON public.credit_transactions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Step 4: Atomic deduct_credits function (with FOR UPDATE row lock)
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Row lock to prevent race conditions
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Insufficient credits', 
            'current_balance', v_current_balance, 
            'required', p_amount
        );
    END IF;

    v_new_balance := v_current_balance - p_amount;

    UPDATE public.profiles
    SET credits_balance = v_new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, balance_after, action)
    VALUES (p_user_id, -p_amount, v_new_balance, p_action);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 5: Atomic add_credits function
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_action TEXT,
    p_set_pro BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    v_new_balance := v_current_balance + p_amount;

    UPDATE public.profiles
    SET credits_balance = v_new_balance,
        plan = CASE WHEN p_set_pro THEN 'pro'::public.user_plan ELSE plan END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, balance_after, action)
    VALUES (p_user_id, p_amount, v_new_balance, p_action);

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 6: Update handle_new_user() trigger to grant 10 welcome credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, plan, credits_balance)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url',
        'free'::public.user_plan,
        10
    );

    INSERT INTO public.credit_transactions (user_id, amount, balance_after, action)
    VALUES (new.id, 10, 10, 'welcome_bonus');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
