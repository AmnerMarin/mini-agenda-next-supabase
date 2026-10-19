'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

const bookingSchema = z.object({
    specialistId: z.uuid(),
    startsAt: z.iso.datetime()
});

export async function createBooking(input: unknown) {
    const supabase = await supabaseServer();

    // 1. Autenticación
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            message: "Debes iniciar sesión"
        };
    }

    // 2. Validación
    const result = bookingSchema.safeParse(input);

    if (!result.success) {
        return {
            success: false,
            message: "Los datos de la reserva son inválidos"
        };
    }

    // 3. Autorización
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "CLIENT") {
        return {
            success: false,
            message: "Solo los clientes pueden reservar"
        };
    }

    // 4. Crear la reserva mediante la RPC
    const { data: bookingId, error } = await supabase.rpc(
        "create_booking",
        {
            p_specialist_id: result.data.specialistId,
            p_starts_at: result.data.startsAt
        }
    );

    if (error?.code === "23P01") {
        return {
            success: false,
            message: "Ese horario ya fue tomado",
            refresh: true
        };
    }

    if (error?.code === "23514") {
        return {
            success: false,
            message: "Ese horario ya no está disponible",
            refresh: true
        };
    }

    if (error || !bookingId) {
        return {
            success: false,
            message: "No se pudo crear la reserva"
        };
    }

    // 5. Revalidación
    revalidatePath(`/book/${result.data.specialistId}`);
    revalidatePath("/client/bookings");

    return {
        success: true,
        message: "Reserva creada correctamente. Estado: PENDING",
        refresh: true
    };
}