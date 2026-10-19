import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                }
            }
        }
    );

    function redirectTo(path: string) {
        const redirect = NextResponse.redirect(new URL(path, request.url));
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
        return redirect;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    // Si no ha iniciado sesión, al login
    if (!user) {
        return redirectTo("/auth/login");
    }

    // Consultamos el rol del usuario
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // Si no tiene perfil, al login
    if (!profile) {
        return redirectTo("/auth/login");
    }

    // Si aún no elige rol, solo lo dejamos entrar a /onboarding
    if (!profile.role) {
        if (path !== "/onboarding") {
            return redirectTo("/onboarding");
        }
        return response;
    }

    // Ruta de inicio según el rol
    const home = profile.role === "CLIENT"
        ? "/client/bookings"
        : "/specialist/bookings";

    if (path === "/onboarding") {
        return redirectTo(home);
    }

    // Proteger rutas de especialista (si no es especialista, lo bota a su home)
    const isSpecialistRoute = path === "/specialist" || path.startsWith("/specialist/");
    if (isSpecialistRoute && profile.role !== "SPECIALIST") {
        return redirectTo(home);
    }

    // Proteger rutas de cliente (si no es cliente, lo bota a su home)
    const isClientRoute =
        path === "/client" ||
        path.startsWith("/client/") ||
        path === "/specialists" ||
        path.startsWith("/specialists/") ||
        path === "/book" ||
        path.startsWith("/book/");
    if (isClientRoute && profile.role !== "CLIENT") {
        return redirectTo(home);
    }

    return response;
}

export const config = {
    matcher: [
        "/onboarding",
        "/client/:path*",
        "/specialist/:path*",
        "/specialists/:path*",
        "/book/:path*"
    ]
};