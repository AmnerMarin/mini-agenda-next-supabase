-- 03. Permisos exigidos por el PDF. Sin USING (true).

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.availability_rules FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.bookings FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, role) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_rules TO authenticated;
GRANT SELECT ON public.bookings TO authenticated;
GRANT INSERT (specialist_id, client_id, starts_at, ends_at, status)
    ON public.bookings TO authenticated;
GRANT UPDATE (status) ON public.bookings TO authenticated;

-- PERFILES: el propio y los de especialistas.
CREATE POLICY profiles_select ON public.profiles
    FOR SELECT TO authenticated
    USING (id = (SELECT auth.uid()) OR role = 'SPECIALIST');

CREATE POLICY profiles_update ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

-- DISPONIBILIDAD: los autenticados leen, solo el dueno modifica.
CREATE POLICY availability_select ON public.availability_rules
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY availability_insert ON public.availability_rules
    FOR INSERT TO authenticated
    WITH CHECK (
        specialist_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'SPECIALIST'
        )
    );

CREATE POLICY availability_update ON public.availability_rules
    FOR UPDATE TO authenticated
    USING (specialist_id = (SELECT auth.uid()))
    WITH CHECK (specialist_id = (SELECT auth.uid()));

CREATE POLICY availability_delete ON public.availability_rules
    FOR DELETE TO authenticated
    USING (specialist_id = (SELECT auth.uid()));

-- RESERVAS: solo participantes pueden leer y actualizar.
CREATE POLICY bookings_select ON public.bookings
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT auth.uid())
        OR specialist_id = (SELECT auth.uid())
    );

CREATE POLICY bookings_insert ON public.bookings
    FOR INSERT TO authenticated
    WITH CHECK (
        client_id = (SELECT auth.uid())
        AND status = 'PENDING'
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (SELECT auth.uid()) AND p.role = 'CLIENT'
        )
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = specialist_id AND p.role = 'SPECIALIST'
        )
    );

CREATE POLICY bookings_update ON public.bookings
    FOR UPDATE TO authenticated
    USING (
        client_id = (SELECT auth.uid())
        OR specialist_id = (SELECT auth.uid())
    )
    WITH CHECK (
        client_id = (SELECT auth.uid())
        OR specialist_id = (SELECT auth.uid())
    );

-- No se concede DELETE en profiles ni bookings.
