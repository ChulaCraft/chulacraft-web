-- LOCAL ONLY. Removes what seed-export-paging.sql added.
delete from public.achievement_awards where achievement_id = '00000000-0000-4000-8000-0000000fa001';
delete from public.event_attendance where event_id = '00000000-0000-4000-8000-0000000fa002';
delete from public.achievements where id = '00000000-0000-4000-8000-0000000fa001';
delete from public.events where id = '00000000-0000-4000-8000-0000000fa002';
alter table public.account_change_log disable trigger user;
delete from public.account_change_log where field = 'paging-seed';
alter table public.account_change_log enable trigger user;
delete from public.reports where details like 'paging-seed%';
delete from public.appeals where message like 'paging-seed%';
delete from public.bans where reason = 'paging-seed ban';
delete from auth.users where email like 'paging-%@seed.local';
