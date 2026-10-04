-- Academic units: the profile gains a study level, the faculty/unit list is
-- reconciled with the real Chula departments, and update_profile_details takes
-- the level (old 6-argument callers keep working).
--
-- The unit names below are the single source of truth for the data map and must
-- stay equal to FACULTIES in src/lib/faculties.ts: the Discord bot turns the
-- stored (faculty, major) pair straight into role names, so a typo here becomes
-- a junk Discord role. Verify with the B.7 step 2 check after the web deploy.

-- --------------------------------------------------------------- backup
-- Taken before the destructive remap below. RLS on with no grants makes it
-- server-only; there is no `private` schema in this project. The migration runs
-- in one transaction, so a failure rolls the whole thing back. Drop this table in
-- a later migration once the new values have proven themselves.
create table if not exists public.profiles_major_backup_20261005 as
  select user_id, faculty, major from public.profiles;
alter table public.profiles_major_backup_20261005 enable row level security;
revoke all on table public.profiles_major_backup_20261005 from anon, authenticated;

-- --------------------------------------------------------------- column
-- study_level is created by 20261005000001 (the bot's RPC returns it); this
-- migration owns the check constraint and the grant.
alter table public.profiles
  add column if not exists study_level text check (study_level in ('undergraduate', 'graduate'));

-- Only the level, not the whole table: the pattern of 20261003000001:12.
grant select (study_level) on public.profiles to authenticated;

-- --------------------------------------------------------------- function
-- Dropping the 6-argument signature also drops its ACL, and a new public function
-- gets EXECUTE for anon/authenticated back by default, so the lockdown is
-- re-applied below (20261003000001:35-36).
drop function if exists public.update_profile_details(uuid, text, text, text, text, text);

create function public.update_profile_details(
  p_user_id uuid, p_first_name text, p_last_name text, p_nickname text, p_faculty text, p_major text,
  p_study_level text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old public.profiles%rowtype;
begin
  if p_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  insert into public.profiles (user_id) values (p_user_id) on conflict do nothing;
  select * into v_old from public.profiles p where p.user_id = p_user_id for update;

  -- A null level means "not sent", so an old caller keeps whatever is stored.
  update public.profiles set first_name = p_first_name, last_name = p_last_name, nickname = nullif(p_nickname, ''),
    faculty = p_faculty, major = p_major, study_level = coalesce(p_study_level, study_level)
    where user_id = p_user_id;

  if v_old.first_name is distinct from p_first_name then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'first_name', v_old.first_name, p_first_name, 'self'); end if;
  if v_old.last_name is distinct from p_last_name then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'last_name', v_old.last_name, p_last_name, 'self'); end if;
  if v_old.nickname is distinct from nullif(p_nickname, '') then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'nickname', v_old.nickname, nullif(p_nickname, ''), 'self'); end if;
  if v_old.faculty is distinct from p_faculty then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'faculty', v_old.faculty, p_faculty, 'self'); end if;
  if v_old.major is distinct from p_major then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'major', v_old.major, p_major, 'self'); end if;
  if v_old.study_level is distinct from coalesce(p_study_level, v_old.study_level) then perform public.log_account_change(p_user_id, p_user_id, 'profiles', null, 'study_level', v_old.study_level, coalesce(p_study_level, v_old.study_level), 'self'); end if;
end;
$$;
revoke all on function public.update_profile_details(uuid, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.update_profile_details(uuid, text, text, text, text, text, text) to service_role;

-- --------------------------------------------------------------- data map
-- 1. The old values that get a new name. Values already equal to a final unit
-- are not listed; they map to themselves and are left alone.
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

-- 2. Anything left that is not a final unit, cleared so the player re-picks from
-- the details form. Matching on the pair matters: 'Dramatic Arts' is a unit under
-- Arts but was never valid under Fine and Applied Arts. No change-log rows for
-- this bulk remap (accepted). study_level stays null, which the bot reads as
-- undergraduate.
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
