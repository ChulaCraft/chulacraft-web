-- google_sub is not readable by the authenticated role, so the dashboard and the
-- unlink action read the caller's claim through the service-role client. That
-- needs the secret key on a page that runs for every signed-in user, so give
-- the caller their own row instead: security definer keyed on auth.uid(), which
-- the caller cannot choose.
create or replace function public.my_chula_claim()
returns table (email text, google_sub text)
language sql stable security definer set search_path = '' as $$
  select c.email, c.google_sub from public.chula_claims c where c.user_id = (select auth.uid());
$$;
revoke all on function public.my_chula_claim() from public, anon, authenticated;
grant execute on function public.my_chula_claim() to authenticated;