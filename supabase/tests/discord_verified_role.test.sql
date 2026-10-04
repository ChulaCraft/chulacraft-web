-- Part A step 2 (verified_members, as amended by B.0) and the B8 SQL cases:
-- the faculty/unit data map, the study level and the update_profile_details
-- lockdown. Plain asserts, same style as redesign_admin.test.sql.
--
-- The migrations run before this file, so the data map has already been applied
-- to whatever rows existed at reset time (none). It is re-applied here to the
-- rows this test creates, which is the only way to assert it.

begin;

select plan(46);

-- Counts below assume no other rows; clear any dev seed (rolled back at the end).
delete from public.account_change_log;
delete from public.minecraft_registrations;
delete from public.chula_claims;
delete from public.profiles;
delete from auth.users;

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- 1 chula player with a profile, 2 chula player without one, 3 guest,
-- 4 unverified player, 5 a row the data map renames, 6 a row it leaves alone.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'cu@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'cu2@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'guest@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'player@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'map@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'keep@test.local');

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values
  ('d-1', '00000000-0000-0000-0000-000000000001', '{"full_name":"CU One"}', 'discord', now(), now()),
  ('d-2', '00000000-0000-0000-0000-000000000002', '{"full_name":"CU Two"}', 'discord', now(), now()),
  ('d-3', '00000000-0000-0000-0000-000000000003', '{"full_name":"Guest"}', 'discord', now(), now()),
  ('d-4', '00000000-0000-0000-0000-000000000004', '{"full_name":"Player"}', 'discord', now(), now()),
  ('d-5', '00000000-0000-0000-0000-000000000005', '{"full_name":"Map"}', 'discord', now(), now()),
  ('d-6', '00000000-0000-0000-0000-000000000006', '{"full_name":"Keep"}', 'discord', now(), now()),
  ('g-1', '00000000-0000-0000-0000-000000000001', '{"email":"one@student.chula.ac.th","email_verified":true}', 'google', now(), now()),
  ('g-2', '00000000-0000-0000-0000-000000000002', '{"email":"two@student.chula.ac.th","email_verified":true}', 'google', now(), now()),
  ('g-5', '00000000-0000-0000-0000-000000000005', '{"email":"map@student.chula.ac.th","email_verified":true}', 'google', now(), now()),
  ('g-6', '00000000-0000-0000-0000-000000000006', '{"email":"keep@student.chula.ac.th","email_verified":true}', 'google', now(), now());

select public.claim_chula('00000000-0000-0000-0000-000000000001', 'g-1', 'one@student.chula.ac.th');
select public.claim_chula('00000000-0000-0000-0000-000000000002', 'g-2', 'two@student.chula.ac.th');
select public.claim_chula('00000000-0000-0000-0000-000000000005', 'g-5', 'map@student.chula.ac.th');
select public.claim_chula('00000000-0000-0000-0000-000000000006', 'g-6', 'keep@student.chula.ac.th');

-- The guest was admitted by an admin, so there is no chula_claims row for them.
update public.profiles set guest_verified_at = now() where user_id = '00000000-0000-0000-0000-000000000003';

update public.profiles set
  faculty = 'Faculty of Engineering', major = 'Civil Engineering (CE)', study_level = 'graduate'
  where user_id = '00000000-0000-0000-0000-000000000001';

-- Old-form values: one the data map renames, one that is already final.
update public.profiles set
  faculty = 'Faculty of Commerce and Accountancy', major = 'Finance'
  where user_id = '00000000-0000-0000-0000-000000000005';
update public.profiles set
  faculty = 'Faculty of Commerce and Accountancy', major = 'Accounting'
  where user_id = '00000000-0000-0000-0000-000000000006';

-- ============================================ the academic data map (B.3/B.6)
-- Statement 1 of the migration, verbatim: only the changed B.6 rows.
update public.profiles p set faculty = m.new_faculty, major = m.new_major
  from (values
    ('Faculty of Architecture', 'Thai Architecture', 'Faculty of Architecture', null),
    ('Faculty of Commerce and Accountancy', 'Finance', 'Faculty of Commerce and Accountancy', 'Banking and Finance'),
    ('Faculty of Commerce and Accountancy', 'Management', 'Faculty of Commerce and Accountancy', 'Commerce'),
    ('Faculty of Commerce and Accountancy', 'Actuarial Science', 'Faculty of Commerce and Accountancy', 'Statistics'),
    ('Faculty of Commerce and Accountancy', 'Information Systems', 'Faculty of Commerce and Accountancy', 'Statistics'),
    ('Faculty of Communication Arts', 'Communication Arts', 'Faculty of Communication Arts', null),
    ('Faculty of Engineering', 'Civil Engineering', 'Faculty of Engineering', 'Civil Engineering (CE)'),
    ('Faculty of Engineering', 'Electrical Engineering', 'Faculty of Engineering', 'Electrical Engineering (EE)'),
    ('Faculty of Engineering', 'Mechanical Engineering', 'Faculty of Engineering', 'Mechanical Engineering (ME)'),
    ('Faculty of Engineering', 'Industrial Engineering', 'Faculty of Engineering', 'Industrial Engineering (IE)'),
    ('Faculty of Engineering', 'Chemical Engineering', 'Faculty of Engineering', 'Chemical Engineering (ChE)'),
    ('Faculty of Engineering', 'Computer Engineering', 'Faculty of Engineering', 'Computer Engineering (CP)'),
    ('Faculty of Engineering', 'Environmental Engineering', 'Faculty of Engineering', 'Environmental Engineering (ENV)'),
    ('Faculty of Engineering', 'Survey Engineering', 'Faculty of Engineering', 'Survey Engineering (SV)'),
    ('Faculty of Engineering', 'Georesources and Petroleum Engineering', 'Faculty of Engineering', 'Mining and Petroleum Engineering'),
    ('Faculty of Engineering', 'Water Resources Engineering', 'Faculty of Engineering', null),
    ('Faculty of Fine and Applied Arts', 'Thai Music', 'Faculty of Fine and Applied Arts', 'Music'),
    ('Faculty of Fine and Applied Arts', 'Western Music', 'Faculty of Fine and Applied Arts', 'Music'),
    ('Faculty of Fine and Applied Arts', 'Dramatic Arts', 'Faculty of Fine and Applied Arts', null),
    ('Faculty of Nursing', 'Nursing Science', 'Faculty of Nursing', 'Nursing'),
    ('Faculty of Pharmaceutical Sciences', 'Pharmaceutical Sciences', 'Faculty of Pharmaceutical Sciences', 'Industrial Pharmacy'),
    ('Faculty of Political Science', 'International Relations', 'Faculty of Political Science', 'International Relations (IR)'),
    ('Faculty of Science', 'Computer Science', 'Faculty of Science', 'Computer Science (CS)'),
    ('Faculty of Veterinary Science', 'Veterinary Medicine', 'Faculty of Veterinary Science', 'Veterinary Science'),
    ('College of Public Health Sciences', 'Public Health', 'College of Public Health Sciences', 'Public Health Sciences'),
    ('College of Interdisciplinary and Integrative Studies', 'Interdisciplinary program', 'College of Interdisciplinary and Integrative Studies', 'Interdisciplinary and Integrative Studies')
  ) as m(old_faculty, old_major, new_faculty, new_major)
 where (p.faculty, p.major) = (m.old_faculty, m.old_major);

select is((select major from public.profiles where user_id = '00000000-0000-0000-0000-000000000005'),
  'Banking and Finance', 'Commerce/Finance maps to Banking and Finance');
select is((select faculty from public.profiles where user_id = '00000000-0000-0000-0000-000000000005'),
  'Faculty of Commerce and Accountancy', 'a renamed unit keeps its faculty');
select is((select major from public.profiles where user_id = '00000000-0000-0000-0000-000000000006'),
  'Accounting', 'an already-final unit (Accounting) survives the map');
select is((select major from public.profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Civil Engineering (CE)', 'a final coded unit is left alone');

-- Every remaining B.6 row, each applied to its own profile row.
create temporary table map_case (id serial primary key, old_faculty text, old_major text, new_major text);
insert into map_case (old_faculty, old_major, new_major) values
  ('Faculty of Commerce and Accountancy', 'Management', 'Commerce'),
  ('Faculty of Commerce and Accountancy', 'Actuarial Science', 'Statistics'),
  ('Faculty of Commerce and Accountancy', 'Information Systems', 'Statistics'),
  ('Faculty of Engineering', 'Electrical Engineering', 'Electrical Engineering (EE)'),
  ('Faculty of Engineering', 'Mechanical Engineering', 'Mechanical Engineering (ME)'),
  ('Faculty of Engineering', 'Industrial Engineering', 'Industrial Engineering (IE)'),
  ('Faculty of Engineering', 'Chemical Engineering', 'Chemical Engineering (ChE)'),
  ('Faculty of Engineering', 'Computer Engineering', 'Computer Engineering (CP)'),
  ('Faculty of Engineering', 'Environmental Engineering', 'Environmental Engineering (ENV)'),
  ('Faculty of Engineering', 'Survey Engineering', 'Survey Engineering (SV)'),
  ('Faculty of Engineering', 'Georesources and Petroleum Engineering', 'Mining and Petroleum Engineering'),
  ('Faculty of Fine and Applied Arts', 'Thai Music', 'Music'),
  ('Faculty of Fine and Applied Arts', 'Western Music', 'Music'),
  ('Faculty of Nursing', 'Nursing Science', 'Nursing'),
  ('Faculty of Pharmaceutical Sciences', 'Pharmaceutical Sciences', 'Industrial Pharmacy'),
  ('Faculty of Political Science', 'International Relations', 'International Relations (IR)'),
  ('Faculty of Science', 'Computer Science', 'Computer Science (CS)'),
  ('Faculty of Veterinary Science', 'Veterinary Medicine', 'Veterinary Science'),
  ('College of Public Health Sciences', 'Public Health', 'Public Health Sciences'),
  ('College of Interdisciplinary and Integrative Studies', 'Interdisciplinary program', 'Interdisciplinary and Integrative Studies');

do $$
declare
  c record;
  v_user uuid;
begin
  for c in select * from map_case order by id loop
    v_user := lpad(to_hex(c.id + 100), 32, '0')::uuid;
    insert into auth.users (id, email) values (v_user, 'case' || c.id || '@test.local');
    update public.profiles p set faculty = c.old_faculty, major = c.old_major where p.user_id = v_user;
  end loop;
end $$;

update public.profiles p set faculty = m.new_faculty, major = m.new_major
  from map_case c
  join (values
    ('Faculty of Commerce and Accountancy', 'Management', 'Faculty of Commerce and Accountancy', 'Commerce'),
    ('Faculty of Commerce and Accountancy', 'Actuarial Science', 'Faculty of Commerce and Accountancy', 'Statistics'),
    ('Faculty of Commerce and Accountancy', 'Information Systems', 'Faculty of Commerce and Accountancy', 'Statistics'),
    ('Faculty of Engineering', 'Electrical Engineering', 'Faculty of Engineering', 'Electrical Engineering (EE)'),
    ('Faculty of Engineering', 'Mechanical Engineering', 'Faculty of Engineering', 'Mechanical Engineering (ME)'),
    ('Faculty of Engineering', 'Industrial Engineering', 'Faculty of Engineering', 'Industrial Engineering (IE)'),
    ('Faculty of Engineering', 'Chemical Engineering', 'Faculty of Engineering', 'Chemical Engineering (ChE)'),
    ('Faculty of Engineering', 'Computer Engineering', 'Faculty of Engineering', 'Computer Engineering (CP)'),
    ('Faculty of Engineering', 'Environmental Engineering', 'Faculty of Engineering', 'Environmental Engineering (ENV)'),
    ('Faculty of Engineering', 'Survey Engineering', 'Faculty of Engineering', 'Survey Engineering (SV)'),
    ('Faculty of Engineering', 'Georesources and Petroleum Engineering', 'Faculty of Engineering', 'Mining and Petroleum Engineering'),
    ('Faculty of Fine and Applied Arts', 'Thai Music', 'Faculty of Fine and Applied Arts', 'Music'),
    ('Faculty of Fine and Applied Arts', 'Western Music', 'Faculty of Fine and Applied Arts', 'Music'),
    ('Faculty of Nursing', 'Nursing Science', 'Faculty of Nursing', 'Nursing'),
    ('Faculty of Pharmaceutical Sciences', 'Pharmaceutical Sciences', 'Faculty of Pharmaceutical Sciences', 'Industrial Pharmacy'),
    ('Faculty of Political Science', 'International Relations', 'Faculty of Political Science', 'International Relations (IR)'),
    ('Faculty of Science', 'Computer Science', 'Faculty of Science', 'Computer Science (CS)'),
    ('Faculty of Veterinary Science', 'Veterinary Medicine', 'Faculty of Veterinary Science', 'Veterinary Science'),
    ('College of Public Health Sciences', 'Public Health', 'College of Public Health Sciences', 'Public Health Sciences'),
    ('College of Interdisciplinary and Integrative Studies', 'Interdisciplinary program', 'College of Interdisciplinary and Integrative Studies', 'Interdisciplinary and Integrative Studies')
  ) as m(old_faculty, old_major, new_faculty, new_major)
    on (m.old_faculty, m.old_major) = (c.old_faculty, c.old_major)
 where p.user_id = lpad(to_hex(c.id + 100), 32, '0')::uuid;

select is((select count(*)::int from map_case c join public.profiles p on p.user_id = lpad(to_hex(c.id + 100), 32, '0')::uuid
  where p.major is distinct from c.new_major), 0,
  'every B.6 row maps exactly as the plan lists it');

-- The rows the map removes. Statement 2 clears them, so they get null.
create temporary table removed_case (id serial primary key, faculty text, major text);
insert into removed_case (faculty, major) values
  ('Faculty of Architecture', 'Thai Architecture'),
  ('Faculty of Communication Arts', 'Communication Arts'),
  ('Faculty of Engineering', 'Water Resources Engineering'),
  ('Faculty of Fine and Applied Arts', 'Dramatic Arts');

do $$
declare
  c record;
begin
  for c in select * from removed_case order by id loop
    insert into auth.users (id, email) values (lpad(to_hex(c.id + 200), 32, '0')::uuid, 'gone' || c.id || '@test.local');
    update public.profiles p set faculty = c.faculty, major = c.major
      where p.user_id = lpad(to_hex(c.id + 200), 32, '0')::uuid;
  end loop;
end $$;

-- Statement 2 of the migration: the full final list, matched on the pair.
update public.profiles set major = null
 where major is not null
   and (faculty, major) not in (select * from (values
    ('Faculty of Allied Health Sciences', 'Medical Technology'),
    ('Faculty of Allied Health Sciences', 'Physical Therapy'),
    ('Faculty of Allied Health Sciences', 'Nutrition and Dietetics'),
    ('Faculty of Allied Health Sciences', 'Radiological Technology'),
    ('Faculty of Architecture', 'Architecture'),
    ('Faculty of Architecture', 'Interior Architecture'),
    ('Faculty of Architecture', 'Landscape Architecture'),
    ('Faculty of Architecture', 'Urban and Regional Planning'),
    ('Faculty of Architecture', 'Industrial Design'),
    ('Faculty of Architecture', 'Housing'),
    ('Faculty of Architecture', 'Architectural Design (INDA)'),
    ('Faculty of Architecture', 'Communication Design (CommDe)'),
    ('Faculty of Arts', 'Thai'),
    ('Faculty of Arts', 'English'),
    ('Faculty of Arts', 'French'),
    ('Faculty of Arts', 'German'),
    ('Faculty of Arts', 'Spanish'),
    ('Faculty of Arts', 'Italian'),
    ('Faculty of Arts', 'Portuguese'),
    ('Faculty of Arts', 'Russian'),
    ('Faculty of Arts', 'Chinese'),
    ('Faculty of Arts', 'Japanese'),
    ('Faculty of Arts', 'Korean'),
    ('Faculty of Arts', 'Vietnamese'),
    ('Faculty of Arts', 'Arabic'),
    ('Faculty of Arts', 'Malay'),
    ('Faculty of Arts', 'Burmese'),
    ('Faculty of Arts', 'South Asian'),
    ('Faculty of Arts', 'History'),
    ('Faculty of Arts', 'Geography'),
    ('Faculty of Arts', 'Philosophy'),
    ('Faculty of Arts', 'Linguistics'),
    ('Faculty of Arts', 'Library and Information Science'),
    ('Faculty of Arts', 'Dramatic Arts'),
    ('Faculty of Arts', 'Comparative Literature'),
    ('Faculty of Arts', 'Language and Culture (BALAC)'),
    ('Faculty of Commerce and Accountancy', 'Accounting'),
    ('Faculty of Commerce and Accountancy', 'Commerce'),
    ('Faculty of Commerce and Accountancy', 'Banking and Finance'),
    ('Faculty of Commerce and Accountancy', 'Marketing'),
    ('Faculty of Commerce and Accountancy', 'Statistics'),
    ('Faculty of Commerce and Accountancy', 'Business Administration (BBA)'),
    ('Faculty of Communication Arts', 'Journalism and New Media'),
    ('Faculty of Communication Arts', 'Media Design and Production'),
    ('Faculty of Communication Arts', 'Public Relations'),
    ('Faculty of Communication Arts', 'Advertising'),
    ('Faculty of Communication Arts', 'Speech Communication'),
    ('Faculty of Communication Arts', 'Performing Arts'),
    ('Faculty of Communication Arts', 'Cinematic Arts'),
    ('Faculty of Communication Arts', 'Communication Management (BCM)'),
    ('Faculty of Dentistry', 'Dentistry'),
    ('Faculty of Economics', 'Economics'),
    ('Faculty of Economics', 'Economics (EBA)'),
    ('Faculty of Education', 'Early Childhood Education'),
    ('Faculty of Education', 'Elementary Education'),
    ('Faculty of Education', 'Secondary Education'),
    ('Faculty of Education', 'Art Education'),
    ('Faculty of Education', 'Music Education'),
    ('Faculty of Education', 'Health and Physical Education'),
    ('Faculty of Education', 'Educational Technology'),
    ('Faculty of Education', 'Non-Formal Education'),
    ('Faculty of Engineering', 'Civil Engineering (CE)'),
    ('Faculty of Engineering', 'Electrical Engineering (EE)'),
    ('Faculty of Engineering', 'Mechanical Engineering (ME)'),
    ('Faculty of Engineering', 'Industrial Engineering (IE)'),
    ('Faculty of Engineering', 'Chemical Engineering (ChE)'),
    ('Faculty of Engineering', 'Computer Engineering (CP)'),
    ('Faculty of Engineering', 'Environmental Engineering (ENV)'),
    ('Faculty of Engineering', 'Mining and Petroleum Engineering'),
    ('Faculty of Engineering', 'Survey Engineering (SV)'),
    ('Faculty of Engineering', 'Metallurgical and Materials Engineering'),
    ('Faculty of Engineering', 'Nuclear Engineering'),
    ('Faculty of Engineering', 'Computer Engineering and Digital Technology (CEDT)'),
    ('Faculty of Engineering', 'Aerospace Engineering (AERO)'),
    ('Faculty of Engineering', 'Automotive Design and Manufacturing Engineering (ADME)'),
    ('Faculty of Engineering', 'Chemical and Process Engineering (ChPE)'),
    ('Faculty of Engineering', 'Information and Communication Engineering (ICE)'),
    ('Faculty of Engineering', 'Nano Engineering (NANO)'),
    ('Faculty of Engineering', 'Robotics and Artificial Intelligence Engineering'),
    ('Faculty of Engineering', 'Semiconductor Engineering'),
    ('Faculty of Fine and Applied Arts', 'Visual Arts'),
    ('Faculty of Fine and Applied Arts', 'Creative Arts'),
    ('Faculty of Fine and Applied Arts', 'Music'),
    ('Faculty of Fine and Applied Arts', 'Dance'),
    ('Faculty of Integrated Agriculture', 'Integrated Agriculture'),
    ('Faculty of Law', 'Law'),
    ('Faculty of Law', 'Business and Tech Laws (LLBel)'),
    ('Faculty of Medicine', 'Medicine'),
    ('Faculty of Medicine', 'Doctor of Medicine (CU-MEDi)'),
    ('Faculty of Nursing', 'Nursing'),
    ('Faculty of Pharmaceutical Sciences', 'Pharmaceutical Care'),
    ('Faculty of Pharmaceutical Sciences', 'Industrial Pharmacy'),
    ('Faculty of Political Science', 'Government'),
    ('Faculty of Political Science', 'International Relations (IR)'),
    ('Faculty of Political Science', 'Public Administration'),
    ('Faculty of Political Science', 'Sociology and Anthropology'),
    ('Faculty of Political Science', 'Politics and Global Studies (PGS)'),
    ('Faculty of Psychology', 'Psychology'),
    ('Faculty of Psychology', 'Psychological Science (JIPP)'),
    ('Faculty of Science', 'Mathematics'),
    ('Faculty of Science', 'Computer Science (CS)'),
    ('Faculty of Science', 'Chemistry'),
    ('Faculty of Science', 'Biology'),
    ('Faculty of Science', 'Physics'),
    ('Faculty of Science', 'Botany'),
    ('Faculty of Science', 'Chemical Technology'),
    ('Faculty of Science', 'Geology'),
    ('Faculty of Science', 'Environmental Science'),
    ('Faculty of Science', 'Marine Science'),
    ('Faculty of Science', 'Biochemistry'),
    ('Faculty of Science', 'Materials Science'),
    ('Faculty of Science', 'Microbiology'),
    ('Faculty of Science', 'Imaging and Printing Technology'),
    ('Faculty of Science', 'Food Technology'),
    ('Faculty of Science', 'Applied Chemistry (BSAC)'),
    ('Faculty of Science', 'Biotechnology'),
    ('Faculty of Science', 'Industrial Science and Technology'),
    ('Faculty of Sports Science', 'Sports Science'),
    ('Faculty of Sports Science', 'Sports Management'),
    ('Faculty of Sports Science', 'Health Promotion'),
    ('Faculty of Sports Science', 'Recreation and Tourism'),
    ('Faculty of Veterinary Science', 'Veterinary Science'),
    ('College of Public Health Sciences', 'Public Health Sciences'),
    ('College of Interdisciplinary and Integrative Studies', 'Interdisciplinary and Integrative Studies'),
    ('School of Integrated Innovation', 'Integrated Innovation (BAScii)')
  ) as v(faculty, major));

select is((select count(*)::int from removed_case c join public.profiles p on p.user_id = lpad(to_hex(c.id + 200), 32, '0')::uuid
  where p.major is not null), 0,
  'every removed unit (Thai Architecture, Communication Arts, Water Resources, Fine Arts Dramatic Arts) is cleared');

-- Fine Arts/Dramatic Arts specifically: the pair never existed in the final list,
-- so even without the map row it would be cleared.
select is((select count(*)::int from public.profiles p
  where (p.faculty, p.major) in (('Faculty of Fine and Applied Arts', 'Dramatic Arts'), ('Faculty of Arts', 'Dramatic Arts'))
    and p.major is null), 0, 'the Dramatic Arts fixture rows were cleared');

-- The pair match is what keeps Dramatic Arts alive under Arts.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'arts@test.local');
update public.profiles set faculty = 'Faculty of Arts', major = 'Dramatic Arts' where user_id = '00000000-0000-0000-0000-0000000000a1';
select is((select major from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a1'), 'Dramatic Arts',
  'Dramatic Arts is a valid unit under Arts, so the pair match keeps it');
drop table removed_case;
drop table map_case;

-- ==================================================== the backup table (B.3)
select ok(exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'profiles_major_backup_20261005'),
  'the pre-remap backup table exists');
select ok((select relrowsecurity from pg_class where relname = 'profiles_major_backup_20261005'),
  'the backup table has row level security on');
select ok(not has_table_privilege('anon', 'public.profiles_major_backup_20261005', 'SELECT'),
  'anonymous users cannot read the backup table');
select ok(not has_table_privilege('authenticated', 'public.profiles_major_backup_20261005', 'SELECT'),
  'players cannot read the backup table');
select ok(has_table_privilege('service_role', 'public.profiles_major_backup_20261005', 'SELECT'),
  'the server can read the backup table');

-- ========================================================= the study level
select ok(has_column_privilege('authenticated', 'public.profiles', 'study_level', 'SELECT'),
  'players can read their own study level');
select ok(has_column_privilege('service_role', 'public.profiles', 'study_level', 'SELECT'),
  'the server can read the study level');

-- The 7-argument signature only: dropping the old one also drops its ACL, so the
-- lockdown has to be re-applied or anon/authenticated get EXECUTE back.
select ok(not has_function_privilege('anon', 'public.update_profile_details(uuid,text,text,text,text,text,text)', 'EXECUTE'),
  'anonymous users cannot execute the 7-argument update_profile_details');
select ok(not has_function_privilege('authenticated', 'public.update_profile_details(uuid,text,text,text,text,text,text)', 'EXECUTE'),
  'players cannot execute the 7-argument update_profile_details');
select ok(has_function_privilege('service_role', 'public.update_profile_details(uuid,text,text,text,text,text,text)', 'EXECUTE'),
  'the server can execute the 7-argument update_profile_details');
select ok(not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'update_profile_details'
      and pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid, p_first_name text, p_last_name text, p_nickname text, p_faculty text, p_major text'),
  'the 6-argument signature is gone');

-- A 6-argument call still resolves: the new argument defaults to null.
select lives_ok($$ select public.update_profile_details('00000000-0000-0000-0000-000000000001',
  'Somchai', 'Kittisak', null, 'Faculty of Arts', 'French') $$, 'a 6-argument call still works');
select is((select study_level from public.profiles where user_id = '00000000-0000-0000-0000-000000000001'), 'graduate',
  'a 6-argument call leaves the stored level untouched');

select lives_ok($$ select public.update_profile_details('00000000-0000-0000-0000-000000000001',
  'Somchai', 'Kittisak', null, 'Faculty of Arts', 'French', 'undergraduate') $$, 'a 7-argument call works');
select is((select study_level from public.profiles where user_id = '00000000-0000-0000-0000-000000000001'), 'undergraduate',
  'a 7-argument call stores the level');
select is((select major from public.profiles where user_id = '00000000-0000-0000-0000-000000000001'), 'French',
  'a 7-argument call stores the unit too');
select is((select new_value from public.account_change_log
  where target_user_id = '00000000-0000-0000-0000-000000000001' and field = 'study_level'
  order by created_at desc, id desc limit 1), 'undergraduate', 'the level change is logged');
-- The fixture set the level to 'graduate' by hand, so only the one real change
-- is logged; the 6-argument call changed no level and logged nothing.
select is((select count(*)::int from public.account_change_log
  where target_user_id = '00000000-0000-0000-0000-000000000001' and field = 'study_level'), 1,
  'only the real level change is logged');

-- ================================================ verified_members (Part A)
select is((select count(*)::int from public.verified_members(array['d-1','d-2','d-3','d-4'],
  array[]::uuid[])), 3,
  'all three discord ids return only the verified players (chula, chula, guest)');
select is((select array_agg(discord_id order by discord_id)::text from public.verified_members(array['d-1','d-2','d-3','d-4'], array[]::uuid[])),
  '{d-1,d-2,d-3}', 'the unverified player is not in the result');
select is((select count(*)::int from public.verified_members(array[]::text[],
  array['00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004']::uuid[])), 3,
  'passing user ids returns the same three players');
select is((select count(*)::int from public.verified_members(array['d-1'], array['00000000-0000-0000-0000-000000000003']::uuid[])), 2,
  'a mixed call returns both (the OR of the two lists)');
select is((select count(*)::int from public.verified_members(array[]::text[], array[]::uuid[])), 0,
  'empty arrays return nothing');
select is((select count(*)::int from public.verified_members(array['d-nope'], array['00000000-0000-0000-0000-999999999999']::uuid[])), 0,
  'unknown ids return nothing');
select is((select count(*)::int from public.verified_members()), 0,
  'no arguments at all return nothing (callers always pass ids)');

-- The columns the bot turns into role names.
select is((select is_chula from public.verified_members(array['d-3'], array[]::uuid[])), false,
  'a guest comes back is_chula = false, so they get verified only');
select is((select is_chula from public.verified_members(array['d-1'], array[]::uuid[])), true,
  'a chula player comes back is_chula = true');
select is((select faculty from public.verified_members(array['d-1'], array[]::uuid[])), 'Faculty of Arts',
  'the faculty comes from the profile');
select is((select major from public.verified_members(array['d-1'], array[]::uuid[])), 'French',
  'the unit comes from the profile');
select is((select study_level from public.verified_members(array['d-1'], array[]::uuid[])), 'undergraduate',
  'the study level comes from the profile');
select is((select count(*)::int from public.verified_members(array['d-2'], array[]::uuid[])), 1,
  'a verified player without a profile row is still returned');
select is((select faculty from public.verified_members(array['d-2'], array[]::uuid[])), null,
  'a verified player without a profile has a null faculty, so no faculty role');

select ok(has_function_privilege('service_role', 'public.verified_members(text[], uuid[])', 'EXECUTE'),
  'the server can call verified_members');
select ok(not has_function_privilege('anon', 'public.verified_members(text[], uuid[])', 'EXECUTE'),
  'anonymous users cannot call verified_members');
select ok(not has_function_privilege('authenticated', 'public.verified_members(text[], uuid[])', 'EXECUTE'),
  'players cannot call verified_members');

-- The ACL checks above prove the privileges; this proves the refusal itself.
-- set local role, because the whole test file runs as the superuser and would
-- otherwise sail straight past the revoke. The message is collected first and
-- written back after reset role, since authenticated owns nothing in pg_temp.
do $$
declare
  v_refused boolean := false;
begin
  set local role authenticated;
  begin
    perform * from public.verified_members(array['d-1']::text[], array[]::uuid[]);
  exception when insufficient_privilege then
    v_refused := true;
  end;
  reset role;
  perform set_config('test.denied_members', v_refused::text, true);
end $$;
select is((select current_setting('test.denied_members')), 'true', 'a player calling verified_members is refused');

-- ============================================== realtime publication (Part A)
select ok(exists (select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chula_claims'),
  'chula_claims is in the realtime publication');
select ok(exists (select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'),
  'profiles is in the realtime publication');

select * from finish();

rollback;
