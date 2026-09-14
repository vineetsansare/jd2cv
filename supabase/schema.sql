-- Create custom types / enums
CREATE TYPE user_plan AS ENUM ('free', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'unpaid');
CREATE TYPE provider_type AS ENUM ('gemini', 'openai', 'anthropic');

-- 1. PROFILES Table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    plan user_plan DEFAULT 'free'::user_plan,
    credits_balance INTEGER DEFAULT 10 NOT NULL,
    generation_count INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 2. CV DOCUMENTS Table (user uploaded resumes)
CREATE TABLE public.cv_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    extracted_text TEXT NOT NULL,
    storage_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for CV Documents
ALTER TABLE public.cv_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can perform all actions on own CVs" 
    ON public.cv_documents FOR ALL 
    USING (auth.uid() = user_id);

-- 3. GENERATIONS Table (CV customize logs & results)
CREATE TABLE public.generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    job_description TEXT NOT NULL,
    aspirations TEXT,
    target_length TEXT NOT NULL,
    cv_markdown TEXT NOT NULL,
    cover_letter TEXT,
    ats_score INTEGER,
    ats_analysis JSONB,
    human_changes JSONB,
    provider_used TEXT,
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Generations
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations" 
    ON public.generations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" 
    ON public.generations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 4. SUBSCRIPTIONS Table (Lemon Squeezy integration)
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lemon_squeezy_id TEXT UNIQUE NOT NULL,
    status subscription_status NOT NULL,
    plan user_plan NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

-- 5. CREDIT TRANSACTIONS Table (Pay-As-You-Go Ledger)
CREATE TABLE public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Credit Transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions" 
    ON public.credit_transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credit transactions" 
    ON public.credit_transactions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Stored Procedures for atomic credit operations
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
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'current_balance', v_current_balance, 'required', p_amount);
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

-- TRIGGER FUNCTION to automatically insert profile on auth.users signup
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

-- Trigger assignment
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. PERSONAL ACCESS TOKENS Table (for Claude MCP, ChatGPT, CLI)
CREATE TABLE public.personal_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Default Agent Key',
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Personal Access Tokens
ALTER TABLE public.personal_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access tokens" 
    ON public.personal_access_tokens FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own access tokens" 
    ON public.personal_access_tokens FOR ALL 
    USING (auth.uid() = user_id);

