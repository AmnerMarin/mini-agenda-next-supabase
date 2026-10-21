
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-retry-count",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function errorResponse(message: string, status: number) {
    return new Response(
        JSON.stringify({ message }),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        }
    );
}

function formatDate(value: string): string {
    return new Date(value)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
}

Deno.serve(async (req: Request) => {
    // Permitir solicitudes desde el navegador
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    if (req.method !== "POST") {
        return errorResponse("Método no permitido", 405);
    }

    // Leer el token del usuario
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return errorResponse("No autenticado", 401);
    }

    const token = authorization.slice(7);

    // 2. Leer el ID de la reserva
    const body: unknown = await req.json().catch(() => null);

    if (
        !body ||
        typeof body !== "object" ||
        !("bookingId" in body) ||
        typeof body.bookingId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.bookingId)
    ) {
        return errorResponse("ID de reserva inválido", 400);
    }

    const bookingId = body.bookingId;

    //Crear el cliente con permisos del usuario
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!url || !anonKey) {
        return errorResponse("Configuración no disponible", 500);
    }

    const supabase = createClient(url, anonKey, {
        global: {
            headers: {
                Authorization: authorization
            }
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    //Verificar el JWT
    const { data: { user }, error: authError } =
        await supabase.auth.getUser(token);

    if (authError || !user) {
        return errorResponse("Sesión inválida", 401);
    }

    // Consultar la reserva (RLS sigue activo)
    const { data: booking, error } = await supabase
        .from("bookings")
        .select(
            "id, client_id, specialist_id, starts_at, ends_at, status"
        )
        .eq("id", bookingId)
        .maybeSingle();

    if (error) {
        return errorResponse("No se pudo consultar la reserva", 500);
    }

    if (
        !booking ||
        (booking.client_id !== user.id &&
            booking.specialist_id !== user.id)
    ) {
        return errorResponse("Reserva no encontrada", 404);
    }

    if (booking.status !== "CONFIRMED") {
        return errorResponse("La reserva no está confirmada", 400);
    }

    // 6. Generar el contenido del calendario
    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Mini-agenda//ES",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${booking.id}@mini-agenda`,
        `DTSTAMP:${formatDate(new Date().toISOString())}`,
        `DTSTART:${formatDate(booking.starts_at)}`,
        `DTEND:${formatDate(booking.ends_at)}`,
        "SUMMARY:Sesion de Mini-agenda",
        "DESCRIPTION:Reserva confirmada en Mini-agenda",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n") + "\r\n";

    // 7. Devolver el archivo .ics
    return new Response(ics, {
        status: 200,
        headers: {
            ...corsHeaders,
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition":
                `attachment; filename="reserva-${booking.id}.ics"`,
            "Cache-Control": "no-store"
        }
    });
});