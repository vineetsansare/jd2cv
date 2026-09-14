-- Migration: Add personal_access_tokens table for Claude MCP, ChatGPT, and CLI integrations
CREATE TABLE IF NOT EXISTS public.personal_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Default Agent Key',
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.personal_access_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can view own access tokens" ON public.personal_access_tokens;
DROP POLICY IF EXISTS "Users can manage own access tokens" ON public.personal_access_tokens;

CREATE POLICY "Users can view own access tokens" 
    ON public.personal_access_tokens FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own access tokens" 
    ON public.personal_access_tokens FOR ALL 
    USING (auth.uid() = user_id);
