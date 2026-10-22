//Guardar los horarios de forma segura
"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { availabilitySchema } from "@/lib/validation/availability";
import z from "zod";

type ActionResult = {
    data?: { message: string };
    error?: string;
};

export async function createAvailability(input: unknown): Promise<ActionResult> {
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    const result = availabilitySchema.safeParse(input);

    if (!result.success) {
        return { error: result.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "SPECIALIST") {
        return { error: "No autorizado" };
    }

    const { error } = await supabase
        .from("availability_rules")
        .insert({
            specialist_id: user.id,
            weekday: result.data.weekday,
            start_time: result.data.start_time,
            end_time: result.data.end_time
        });

    if (error) {
        if (error.code === "23P01") {
            return { error: "Este horario se superpone con otro existente" };
        }

        return { error: "No se pudo guardar el horario" };
    }

    // Actualizar la página
    revalidatePath("/specialist/availability");

    return {
        data: { message: "Horario guardado correctamente" }
    };
}

export async function updateAvailability(id: string, input: unknown): Promise<ActionResult> {
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }


    const parsedId = z.string().uuid().safeParse(id);
    const result = availabilitySchema.safeParse(input);

    if (!result.success || !parsedId.success) {
        return { error: "Datos inválidos" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "SPECIALIST") {
        return { error: "No autorizado" };
    }


    const { data, error } = await supabase
        .from("availability_rules")
        .update(result.data)
        .eq("id", parsedId.data)
        .eq("specialist_id", user.id)
        .select("id")
        .single();

    if (error?.code === "23P01") {
        return { error: "El horario se superpone con otro existente" };
    }

    if (error || !data) {
        return { error: "No se pudo actualizar el horario" };
    }

    revalidatePath("/specialist/availability");

    return {
        data: { message: "Horario actualizado correctamente" }
    };

}

export async function deleteAvailability(id: string): Promise<ActionResult> {
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    const parsedId = z.string().uuid().safeParse(id);

    if (!parsedId.success) {
        return { error: "ID de horario inválido" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "SPECIALIST") {
        return { error: "No autorizado" };
    }

    const { data, error } = await supabase
        .from("availability_rules")
        .delete()
        .eq("id", parsedId.data)
        .eq("specialist_id", user.id)
        .select("id")
        .single();

    if (error || !data) {
        return { error: "No se pudo eliminar el horario" };
    }
    revalidatePath("/specialist/availability");

    return {
        data: { message: "Horario eliminado correctamente" }
    };
}
