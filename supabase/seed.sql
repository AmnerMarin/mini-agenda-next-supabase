-- Registrar primero especialista.demo@example.com usando Supabase Auth
-- y asignarle el rol SPECIALIST.
-- El seed no crea usuarios ni modifica franjas existentes.
INSERT INTO public.availability_rules (
    specialist_id,
    weekday,
    start_time,
    end_time
)
SELECT
    specialist.id,
    sample.weekday,
    sample.start_time,
    sample.end_time
FROM auth.users AS auth_user
JOIN public.profiles AS specialist
    ON specialist.id = auth_user.id
CROSS JOIN (
    VALUES
        (1::SMALLINT, TIME '09:00', TIME '12:00'),
        (3::SMALLINT, TIME '14:00', TIME '17:00'),
        (5::SMALLINT, TIME '09:00', TIME '13:00')
) AS sample(weekday, start_time, end_time)
WHERE LOWER(auth_user.email) = 'especialista.demo@example.com'
  AND specialist.role = 'SPECIALIST'
  AND NOT EXISTS (
      SELECT 1
      FROM public.availability_rules AS existing
      WHERE existing.specialist_id = specialist.id
        AND existing.weekday = sample.weekday
        AND existing.start_time < sample.end_time
        AND sample.start_time < existing.end_time
  );
