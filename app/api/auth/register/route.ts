import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
    const input: unknown = await request.json().catch(() => null);

    const result = registerSchema.safeParse(input);

    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0]?.message ?? "Datos inválidos" },
            { status: 400 }
        );
    }

    const supabase = await supabaseServer();

    const { full_name, email, password, role } = result.data;

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
                role
            },
            emailRedirectTo: `${new URL(request.url).origin}/auth/confirm`
        }
    });

    if (error) {
        return NextResponse.json(
            { error: error.message ?? "No se pudo completar el registro" },
            { status: error.status ?? 400 }
        );
    }

    return NextResponse.json({
        message: "Registro recibido. Revisa tu correo para confirmar tu cuenta."
    });
}