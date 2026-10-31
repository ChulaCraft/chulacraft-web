-- LOCAL ONLY. Removes what seed-export-paging.sql added.
delete from auth.users where email like 'paging-%@seed.local';
