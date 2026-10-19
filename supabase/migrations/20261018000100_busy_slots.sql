
-- 1. Crear un esquema interno, no expuesto por la API
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Función interna para obtener horarios ocupados
CREATE OR REPLACE FUNCTION private.read_busy_slots(
    p_specialist_id UUID,
    p_day DATE
)
RETURNS TABLE (
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status public.booking_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        b.starts_at,
        b.ends_at,
        b.status
    FROM public.bookings b
    WHERE b.specialist_id = p_specialist_id
        AND b.status IN ('PENDING', 'CONFIRMED')
        AND (b.starts_at AT TIME ZONE 'America/Lima')::DATE = p_day
        AND p_day >= (NOW() AT TIME ZONE 'America/Lima')::DATE
        AND EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
                AND p.role = 'CLIENT'
        )
        AND EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = p_specialist_id
                AND p.role = 'SPECIALIST'
        );
$$;

-- 3. Limitar el acceso a la función interna
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

REVOKE ALL ON FUNCTION private.read_busy_slots(UUID, DATE)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.read_busy_slots(UUID, DATE)
TO authenticated;

-- 4. Función que llamará Next.js
CREATE OR REPLACE FUNCTION public.get_busy_slots(
    p_specialist_id UUID,
    p_day DATE
)
RETURNS TABLE (
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status public.booking_status
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT
        b.starts_at,
        b.ends_at,
        b.status
    FROM private.read_busy_slots(p_specialist_id, p_day) b;
$$;

-- 5. Solo usuarios autenticados pueden invocarla
REVOKE ALL ON FUNCTION public.get_busy_slots(UUID, DATE)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_busy_slots(UUID, DATE)
TO authenticated;