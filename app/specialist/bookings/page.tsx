import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingActions } from "./BookingActions";
import { LogoutButton } from "@/components";
import { formatTime12h } from "@/lib/utils/formatTime";
import { LuCalendar, LuClock } from "react-icons/lu";

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
        PENDING: { label: "Pendiente", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
        CONFIRMED: { label: "Confirmada", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
        CANCELLED: { label: "Cancelada", bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
        COMPLETED: { label: "Completada", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
    };

    const item = config[status] ?? { label: status, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.bg} ${item.text} ${item.border}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {item.label}
        </span>
    );
}

async function SpecialistBookingsContent() {
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

    if (profile?.role === "CLIENT") {
        redirect("/client/bookings");
    }

    if (profile?.role !== "SPECIALIST") {
        redirect("/onboarding");
    }

    // 3. Consultar las reservas del especialista
    const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, starts_at, ends_at, status")
        .eq("specialist_id", user.id)
        .order("starts_at", { ascending: false });

    if (error) {
        return (
            <main className="p-6">
                <p role="alert" className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                    No se pudieron cargar las reservas.
                </p>
            </main>
        );
    }

    const now = new Date();

    // 4. Mostrar las reservas
    return (
        <main className="mx-auto max-w-4xl p-6">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-[#102449]">
                        Reservas recibidas
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Consulta y administra tus citas agendadas con clientes.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/specialist/availability"
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                    >
                        <LuClock className="w-4 h-4 text-blue-700" />
                        <span>Gestionar disponibilidad</span>
                    </Link>
                    <LogoutButton />
                </div>
            </header>

            {bookings?.length === 0 ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-8 text-center text-blue-900">
                    <p className="font-semibold text-lg">Todavía no tienes reservas de clientes.</p>
                    <p className="mt-1 text-sm text-blue-700">Asegúrate de tener tus horarios de atención configurados en disponibilidad.</p>
                    <Link
                        href="/specialist/availability"
                        className="mt-5 inline-block rounded-lg bg-[#2457e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                        Ver mi disponibilidad
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings?.map((booking) => (
                        <article
                            key={booking.id}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-[#102449]">
                                        Reserva de sesión
                                    </h2>
                                    <p className="text-xs text-slate-500">Sesión de 60 minutos</p>
                                </div>

                                <StatusBadge status={booking.status} />
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <LuCalendar className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>
                                        {new Date(booking.starts_at).toLocaleDateString(
                                            "es-PE",
                                            {
                                                timeZone: "America/Lima",
                                                dateStyle: "full"
                                            }
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <LuClock className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>
                                        {formatTime12h(booking.starts_at)}
                                        {" – "}
                                        {formatTime12h(booking.ends_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3">
                                <BookingActions
                                    bookingId={booking.id}
                                    status={booking.status}
                                    canComplete={
                                        booking.status === "CONFIRMED" &&
                                        new Date(booking.starts_at) <= now
                                    }
                                />
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}

export default function SpecialistBookingsPage() {
    return (
        <Suspense fallback={
            <p className="text-center text-xl font-bold mt-12 text-slate-500">
                Cargando reservas...
            </p>
        }>
            <SpecialistBookingsContent />
        </Suspense>
    );
}