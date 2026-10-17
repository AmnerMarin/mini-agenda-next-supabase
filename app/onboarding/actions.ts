"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/auth";

export async function completeOnboarding(input: unknown) {
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Debes iniciar sesión" };
    }

    const result = onboardingSchema.safeParse(input);
    if (!result.success) {
        return { error: result.error.issues[0]?.message ?? "Datos inválidos" };
    }

    // Guardamos en la base de datos (solo si el rol estaba vacío)
    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: result.data.full_name,
            role: result.data.role
        })
        .eq("id", user.id)
        .is("role", null);

    if (error) {
        return { error: "No se pudo guardar el perfil o el rol ya fue asignado" };
    }

    revalidatePath("/onboarding");

    return {
        data: { role: result.data.role }
    };
}