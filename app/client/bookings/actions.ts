"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

type ActionResult = {
    data?: { message: string };
    error?: string;
};

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
    const supabase = await supabaseServer();

    // 1. Autenticación
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autenticado" };
    }

    // 2. Validación
    const result = z.uuid().safeParse(bookingId);

    if (!result.success) {
        return { error: "Reserva inválida" };
    }

    // 3. Autorización
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "CLIENT") {
        return { error: "No autorizado" };
    }

    // 4. Cambiar el estado de la reserva
    const { data, error } = await supabase
        .from("bookings")
        .update({ status: "CANCELLED" })
        .eq("id", result.data)
        .eq("client_id", user.id)
        .in("status", ["PENDING", "CONFIRMED"])
        .gt("starts_at", new Date().toISOString())
        .select("id")
        .maybeSingle();

    if (error || !data) {
        return { error: "Esta reserva ya no se puede cancelar" };
    }

    // 5. Actualizar la página
    revalidatePath("/client/bookings");

    return {
        data: { message: "Reserva cancelada correctamente" }
    };
}
