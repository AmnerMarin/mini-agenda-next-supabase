-- Permitir que un especialista pueda consultar el perfil (nombre) de los clientes que han reservado con él
DROP POLICY IF EXISTS profiles_select ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = (SELECT auth.uid())
        OR role = 'SPECIALIST'
        OR EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.specialist_id = (SELECT auth.uid())
              AND b.client_id = public.profiles.id
        )
    );
