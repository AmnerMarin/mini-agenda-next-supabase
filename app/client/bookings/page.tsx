
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { connection } from "next/server";
import { Suspense } from "react";

const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    COMPLETED: "Completada"
};

async function ClientBookingsContent() {
    await connection();

    const supabase = await supabaseServer();

    // 1. Autenticación
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // 2. Autorización
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role === "SPECIALIST") {
        redirect("/specialist/bookings");
    }

    if (profile?.role !== "CLIENT") {
        redirect("/onboarding");
    }

    // 3. Consultar las reservas del cliente
    const { data: bookings, error } = await supabase
        .from("bookings")
        .select(
            "id, starts_at, ends_at, status, specialist:profiles!bookings_specialist_id_fkey(full_name)"
        )
        .eq("client_id", user.id)
        .order("starts_at", { ascending: false });

    if (error) {
        return (
            <main className="p-6">
                <p role="alert" className="text-red-600">
                    No se pudieron cargar tus reservas.
                </p>
            </main>
        );
    }

    // 4. Mostrar las reservas
    return (
        <main className="mx-auto max-w-4xl p-6">
            <h1 className="text-2xl font-bold text-[#102449]">
                Mis reservas
            </h1>

            <p className="mt-2 text-slate-600">
                Consulta tus sesiones y su estado actual.
            </p>

            <Link
                href="/specialists"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"
            >
                Nueva reserva
            </Link>

            {bookings?.length === 0 ? (
                <p className="mt-6 rounded-lg bg-blue-50 p-4 text-blue-800">
                    Todavía no tienes reservas.
                </p>
            ) : (
                <div className="mt-6 space-y-4">
                    {bookings?.map((booking) => (
                        <article
                            key={booking.id}
                            className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <h2 className="text-lg font-semibold text-[#102449]">
                                {booking.specialist?.[0]?.full_name ?? "Especialista"}
                            </h2>

                            <p className="mt-2 text-sm text-slate-600">
                                Fecha:{" "}
                                {new Date(booking.starts_at).toLocaleDateString(
                                    "es-PE",
                                    {
                                        timeZone: "America/Lima",
                                        dateStyle: "long"
                                    }
                                )}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                Horario:{" "}
                                {new Date(booking.starts_at).toLocaleTimeString(
                                    "es-PE",
                                    {
                                        timeZone: "America/Lima",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false
                                    }
                                )}
                                {" – "}
                                {new Date(booking.ends_at).toLocaleTimeString(
                                    "es-PE",
                                    {
                                        timeZone: "America/Lima",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false
                                    }
                                )}
                            </p>

                            <p className="mt-3 text-sm font-medium">
                                Estado: {statusLabels[booking.status]}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}

function ClientBookingsPage() {
    return (
        <div>
            <Suspense fallback={    
                <p className="text-center text-xl font-bold mt-4 text-slate-500">Cargando reservas...</p>
            }>
                <ClientBookingsContent />
            </Suspense>
        </div>
    );
}

export default ClientBookingsPage;