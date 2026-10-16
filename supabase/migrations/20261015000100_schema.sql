CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE public.user_role AS ENUM ('SPECIALIST', 'CLIENT');
CREATE TYPE public.booking_status AS ENUM (
    'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL CHECK (BTRIM(full_name) <> ''),
    role public.user_role,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID NOT NULL REFERENCES public.profiles(id),
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time)
);

-- Dos franjas del mismo dia y especialista no pueden superponerse.
ALTER TABLE public.availability_rules
    ADD CONSTRAINT availability_no_overlap
    EXCLUDE USING gist (
        specialist_id WITH =,
        weekday WITH =,
        numrange(
            EXTRACT(EPOCH FROM start_time),
            EXTRACT(EPOCH FROM end_time),
            '[)'
        ) WITH &&
    );

CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id UUID NOT NULL REFERENCES public.profiles(id),
    client_id UUID NOT NULL REFERENCES public.profiles(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status public.booking_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (specialist_id <> client_id),
    CHECK (ends_at = starts_at + INTERVAL '60 minutes')
);

-- Las reservas PENDING y CONFIRMED bloquean el horario.
ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_no_overlap
    EXCLUDE USING gist (
        specialist_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
    ) WHERE (status IN ('PENDING', 'CONFIRMED'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
