-- Trigger-only SECURITY DEFINER functions must not be callable as public RPC endpoints.
-- PostgreSQL does not re-check EXECUTE privileges when a trigger invokes its function.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.log_announcement_change() from public, anon, authenticated;
revoke all on function public.enqueue_announcement_email_notifications() from public, anon, authenticated;
