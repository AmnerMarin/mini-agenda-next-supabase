import { Suspense } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { LogoutButton } from "@/components";
import { LuArrowLeft } from "react-icons/lu";
import { AvailabilityForm } from "./AvailabilityForm";
import { AvailabilityItem } from "./AvailabilityItem";

interface Day {
    number: number;
    name: string;
}

const days: Day[] = [
    { number: 1, name: "Lunes" },
    { number: 2, name: "Martes" },
    { number: 3, name: "Miércoles" },
    { number: 4, name: "Jueves" },
    { number: 5, name: "Viernes" },
    { number: 6, name: "Sábado" },
    { number: 0, name: "Domingo" }
];

async function AvailabilityContent() {
    await connection();

    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id,role")
        .eq("id", user.id)
        .single();

    if (!profile) {
        redirect("/auth/login");
    }

    if (profile.role === "CLIENT") {
        redirect("/client/bookings");
    }

    if (profile.role !== "SPECIALIST") {
        redirect("/onboarding");
    }

    const { data: rules, error } = await supabase
        .from("availability_rules")
        .select("id, weekday, start_time, end_time")
        .eq("specialist_id", user.id)
        .order("start_time", { ascending: true });

    if (error) {
        return (
            <p role="alert" className="text-red-600">
                No se pudo cargar la disponibilidad.
            </p>
        );
    }

    const schedule = days.map((day) => ({
        name: day.name,
        number: day.number,
        slots: (rules ?? []).filter((rule) => rule.weekday === day.number)
    }));

    return (
        <>
            {rules?.length === 0 && (
                <p className="mt-6 rounded-lg bg-blue-50 p-4 text-blue-800">
                    Todavía no tienes horarios registrados.
                </p>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                {schedule.map((day) => (
                    <section
                        key={day.number}
                        className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                        <h2 className="mb-3 font-semibold text-[#102449]">
                            {day.name}
                        </h2>

                        {day.slots.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Sin disponibilidad
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {day.slots.map((slot) => (
                                    <li key={slot.id}>
                                        <AvailabilityItem rule={slot} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}

export default function AvailabilityPage() {
    return (
        <main className="mx-auto max-w-5xl p-6">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <Link
                        href="/specialist/bookings"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition mb-2"
                    >
                        <LuArrowLeft className="w-4 h-4" />
                        <span>Volver a mis reservas</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-[#102449]">
                        Mi disponibilidad
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Configura y consulta tus horarios semanales de atención.
                    </p>
                </div>
                <LogoutButton />
            </header>

            <AvailabilityForm />

            <Suspense fallback={<p className="mt-6 text-slate-500">Cargando disponibilidad...</p>}>
                <AvailabilityContent />
            </Suspense>
        </main>
    );
}