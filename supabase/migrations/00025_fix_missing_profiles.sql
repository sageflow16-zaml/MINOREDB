-- Migration 00025: Create missing profile rows for existing auth users
-- The on_auth_user_created trigger only fires on new signups.
-- Users who existed before the trigger was installed have no profile row.
-- This breaks INSERT on any table that FK-references public.profiles(id).

INSERT INTO public.profiles (id, email, name)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data ->> 'name'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);
