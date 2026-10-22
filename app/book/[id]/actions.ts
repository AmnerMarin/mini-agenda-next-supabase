'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

const bookingSchema = z.object({
    specialistId: z.uuid(),
    startsAt: z.iso.datetime()
});

type BookingActionResult = {
    data?: { message?: string; refresh?: boolean };
    error?: string;
};

export async function createBooking(input: unknown): Promise<BookingActionResult> {
    const supabase = await supabaseServer();

    // 1. Autenticación
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Debes iniciar sesión" };
    }

    // 2. Validación
    const result = bookingSchema.safeParse(input);

    if (!result.success) {
        return { error: "Los datos de la reserva son inválidos" };
    }

    // 3. Autorización
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "CLIENT") {
        return { error: "Solo los clientes pueden reservar" };
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
            data: { refresh: true },
            error: "Ese horario ya fue tomado"
        };
    }

    if (error?.code === "23514") {
        return {
            data: { refresh: true },
            error: "Ese horario ya no está disponible"
        };
    }

    if (error || !bookingId) {
        return {
            error: error?.message ?? "No se pudo crear la reserva"
        };
    }

    // 5. Revalidación
    revalidatePath(`/book/${result.data.specialistId}`);
    revalidatePath("/client/bookings");

    return {
        data: {
            message: "Reserva creada correctamente. Estado: PENDING",
            refresh: true
        }
    };
}
