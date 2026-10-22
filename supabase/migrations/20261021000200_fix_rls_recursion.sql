-- Romper recursión infinita (42P17) entre políticas RLS de profiles y bookings
CREATE OR REPLACE FUNCTION public.is_client_of_specialist(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE specialist_id = auth.uid()
          AND client_id = p_profile_id
    );
$$;

REVOKE ALL ON FUNCTION public.is_client_of_specialist(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_client_of_specialist(UUID) TO authenticated;

DROP POLICY IF EXISTS profiles_select ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = (SELECT auth.uid())
        OR role = 'SPECIALIST'
        OR public.is_client_of_specialist(public.profiles.id)
    );
