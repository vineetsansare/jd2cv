-- ==============================================================================
-- Rollback: 20260924_data_api_table_grants_rollback.sql
-- Description:
--   Revokes explicit Data API grants on application tables.
-- ==============================================================================

REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles FROM authenticated, service_role;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.cv_documents FROM authenticated, service_role;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.generations FROM authenticated, service_role;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.subscriptions FROM authenticated, service_role;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.credit_transactions FROM authenticated, service_role;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.personal_access_tokens FROM authenticated, service_role;
