
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

const statusSchema = z.object({
    bookingId: z.uuid(),
    status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"])
});

type ActionResult = {
    data?: { message: string };
    error?: string;
};

export async function updateBookingStatus(input: unknown): Promise<ActionResult> {
    const supabase = await supabaseServer();

    // 1. Autenticación
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    // 2. Validación
    const result = statusSchema.safeParse(input);

    if (!result.success) {
        return { error: "Datos inválidos" };
    }

    // 3. Autorización
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "SPECIALIST") {
        return { error: "No autorizado" };
    }

    // 4. Identificar el estado desde el cual se permite el cambio
    const { bookingId, status } = result.data;

    const previousStatus = status === "COMPLETED"
        ? "CONFIRMED"
        : "PENDING";

    // 5. Actualizar únicamente una reserva propia
    let query = supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .eq("specialist_id", user.id)
        .eq("status", previousStatus);

    // Para completar, la sesión ya debe haber comenzado
    if (status === "COMPLETED") {
        query = query.lte("starts_at", new Date().toISOString());
    }

    const { data, error } = await query
        .select("id")
        .maybeSingle();

    if (error || !data) {
        return { error: "No se pudo cambiar el estado de esta reserva" };
    }

    // 6. Actualizar las pantallas
    revalidatePath("/specialist/bookings");
    revalidatePath("/client/bookings");

    return {
        data: { message: "Estado actualizado correctamente" }
    };
}
