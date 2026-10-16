CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_name TEXT;
    v_role TEXT;
BEGIN
    v_name := COALESCE(
        NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''),
        NULLIF(SPLIT_PART(NEW.email, '@', 1), ''),
        'Usuario'
    );

    v_role := NEW.raw_user_meta_data ->> 'role';

    -- Google puede registrarse sin rol y completarlo en onboarding.
    IF v_role IS NOT NULL AND v_role NOT IN ('CLIENT', 'SPECIALIST') THEN
        RAISE EXCEPTION 'Rol inválido' USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (NEW.id, v_name, v_role::public.user_role);

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Una vez elegido, el rol no se puede cambiar.
CREATE FUNCTION public.protect_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
        OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'No puedes cambiar estos datos del perfil';
    END IF;

    IF OLD.role IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'El rol no se puede cambiar';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile() FROM PUBLIC;
