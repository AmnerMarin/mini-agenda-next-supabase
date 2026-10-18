//Guardar los horarios de forma segura
"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { availabilitySchema } from "@/lib/validation/availability";
import z from "zod";

export async function createAvailability(input: unknown) {
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "No autenticado" };
    }

    const result = availabilitySchema.safeParse(input);

    if (!result.success) {
        return {
            success: false,
            message: result.error.issues[0]?.message ?? "Datos inválidos"
        };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "SPECIALIST") {
        return { success: false, message: "No autorizado" };
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
            return {
                success: false,
                message: "Este horario se superpone con otro existente"
            };
        }

        return {
            success: false,
            message: "No se pudo guardar el horario"
        };
    }

    // Actualizar la página
    revalidatePath("/specialist/availability");

    return {
        success: true,
        message: "Horario guardado correctamente"
    };
}

export async function updateAvailability(id: string, input: unknown) {
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "No autenticado" };
    }


    const parsedId = z.string().uuid().safeParse(id);
    const result = availabilitySchema.safeParse(input);

    if (!result.success || !parsedId.success) {
        return { success: false, message: "Datos inválidos" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "SPECIALIST") {
        return { success: false, message: "No autorizado" };
    }


    const { data, error } = await supabase
        .from("availability_rules")
        .update(result.data)
        .eq("id", parsedId.data)
        .eq("specialist_id", user.id)
        .select("id")
        .single();

    if (error?.code === "23P01") {
        return {
            success: false,
            message: "El horario se superpone con otro existente"
        };
    }

    if (error || !data) {
        return {
            success: false,
            message: "No se pudo actualizar el horario"
        };
    }

    revalidatePath("/specialist/availability");

    return {
        success: true,
        message: "Horario actualizado correctamente"
    };

}

export async function deleteAvailability(id: string) {
    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "No autenticado" };
    }

    const parsedId = z.string().uuid().safeParse(id);

    if (!parsedId.success) {
        return {
            success: false,
            message: "ID de horario inválido"
        };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "SPECIALIST") {
        return { success: false, message: "No autorizado" };
    }

    const { data, error } = await supabase
        .from("availability_rules")
        .delete()
        .eq("id", parsedId.data)
        .eq("specialist_id", user.id)
        .select("id")
        .single();

    if (error || !data) {
        return {
            success: false,
            message: "No se pudo eliminar el horario"
        };
    }
    revalidatePath("/specialist/availability");

    return {
        success: true,
        message: "Horario eliminado correctamente"
    };
}