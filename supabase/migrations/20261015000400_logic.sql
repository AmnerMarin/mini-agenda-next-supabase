
-- El horario debe estar en el futuro y dentro de una franja de 60 minutos.
CREATE FUNCTION public.is_slot_valid(
    p_specialist_id UUID,
    p_starts_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT COALESCE(
        p_starts_at > NOW()
        AND EXISTS (
            SELECT 1
            FROM public.availability_rules a
            WHERE a.specialist_id = p_specialist_id
                AND a.weekday = EXTRACT(DOW FROM (
                    p_starts_at AT TIME ZONE 'America/Lima'
                ))::SMALLINT
                AND (p_starts_at AT TIME ZONE 'America/Lima')::TIME >= a.start_time
                AND EXTRACT(EPOCH FROM (
                    p_starts_at AT TIME ZONE 'America/Lima'
                )::TIME) + 3600 <= EXTRACT(EPOCH FROM a.end_time)
        ),
        FALSE
    );
$$;

-- Impide insertar fuera del horario, incluso sin utilizar la RPC.
CREATE FUNCTION public.check_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.client_id IS DISTINCT FROM auth.uid()
        OR NEW.status <> 'PENDING'
        OR NOT public.is_slot_valid(NEW.specialist_id, NEW.starts_at) THEN
        RAISE EXCEPTION 'Reserva no permitida' USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER check_booking_before_insert
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_booking_insert();

-- Controla las transiciones y prohibe modificar participantes o fechas.
CREATE FUNCTION public.check_booking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_user UUID := auth.uid();
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
        OR NEW.specialist_id IS DISTINCT FROM OLD.specialist_id
        OR NEW.client_id IS DISTINCT FROM OLD.client_id
        OR NEW.starts_at IS DISTINCT FROM OLD.starts_at
        OR NEW.ends_at IS DISTINCT FROM OLD.ends_at
        OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'No puedes cambiar los datos fijos de la reserva';
    END IF;

    IF v_user = OLD.specialist_id
        AND OLD.status = 'PENDING'
        AND NEW.status IN ('CONFIRMED', 'CANCELLED') THEN
        RETURN NEW;
    END IF;

    IF v_user = OLD.client_id
        AND OLD.status IN ('PENDING', 'CONFIRMED')
        AND NEW.status = 'CANCELLED'
        AND OLD.starts_at > NOW() THEN
        RETURN NEW;
    END IF;

    IF v_user = OLD.specialist_id
        AND OLD.status = 'CONFIRMED'
        AND NEW.status = 'COMPLETED'
        AND OLD.starts_at <= NOW() THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Transición no permitida' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER check_booking_before_update
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_booking_update();

-- Función pedida por el PDF: usa el usuario actual y respeta RLS.
CREATE FUNCTION public.create_booking(
    p_specialist_id UUID,
    p_starts_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_client UUID := auth.uid();
    v_id UUID;
BEGIN
    IF v_client IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
    END IF;

    IF NOT public.is_slot_valid(p_specialist_id, p_starts_at) THEN
        RAISE EXCEPTION 'Horario no disponible' USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.bookings (
        specialist_id, client_id, starts_at, ends_at, status
    ) VALUES (
        p_specialist_id,
        v_client,
        p_starts_at,
        p_starts_at + INTERVAL '60 minutes',
        'PENDING'
    ) RETURNING id INTO v_id;

    RETURN v_id;
EXCEPTION
    WHEN exclusion_violation THEN
        RAISE EXCEPTION 'Ese horario ya fue tomado' USING ERRCODE = '23P01';
END;
$$;

REVOKE ALL ON FUNCTION public.is_slot_valid(UUID, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_booking(UUID, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_booking_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_booking_update() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_slot_valid(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, TIMESTAMPTZ) TO authenticated;
