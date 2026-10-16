-- Registrar primero especialista.demo@example.com usando Supabase Auth y elegir el rol SPECIALIST. Si no existe, no se insertan horarios.

INSERT INTO public.availability_rules (
    specialist_id, weekday, start_time, end_time
)
SELECT p.id, 1, '09:00', '12:00'
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'especialista.demo@example.com'
    AND p.role = 'SPECIALIST';