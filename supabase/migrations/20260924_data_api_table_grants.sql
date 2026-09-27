-- ==============================================================================
-- Migration: 20260924_data_api_table_grants.sql
-- Description:
--   Explicitly grants Data API privileges to 'authenticated' and 'service_role'
--   roles for all application tables in public schema.
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cv_documents TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.generations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.subscriptions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_transactions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.personal_access_tokens TO authenticated, service_role;
