
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { computeDaySlots } from "@/lib/slots/computeDaySlots";
import { connection } from "next/server";
import { Suspense } from "react";

type BookPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ date?: string }>;
};

async function BookContent({
    params,
    searchParams
}: BookPageProps) {

    await connection();
    const { id } = await params;
    const { date } = await searchParams;

    if (!z.uuid().safeParse(id).success) {
        notFound();
    }

    const today = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Lima"
    }).format(new Date());

    const parsedDate = z.iso.date().safeParse(date);
    const selectedDate = parsedDate.success
        ? parsedDate.data
        : today;

    const supabase = await supabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "CLIENT") {
        redirect("/auth/login");
    }

    const { data: specialist } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", id)
        .eq("role", "SPECIALIST")
        .maybeSingle();

    if (!specialist) {
        notFound();
    }

    // Obtener las franjas del día seleccionado
    const weekday = new Date(
        `${selectedDate}T12:00:00Z`
    ).getUTCDay();

    const { data: rules, error: rulesError } = await supabase
        .from("availability_rules")
        .select("weekday, start_time, end_time")
        .eq("specialist_id", specialist.id)
        .eq("weekday", weekday);

    // Obtener los horarios ocupados
    const { data: busy, error: busyError } = await supabase
        .rpc("get_busy_slots", {
            p_specialist_id: specialist.id,
            p_day: selectedDate
        });

    if (rulesError || busyError) {
        return (
            <main className="p-6">
                <p role="alert" className="text-red-600">
                    No se pudieron consultar los horarios.
                </p>
            </main>
        );
    }

    //Calcular los huecos libres
    const slots = computeDaySlots(
        rules ?? [],
        busy ?? [],
        {
            dia: selectedDate,
            ahora: new Date().toISOString()
        }
    );
    return (
        <main className="mx-auto max-w-3xl p-6">
            <h1 className="text-2xl font-bold text-[#102449]">
                Reservar con {specialist.full_name}
            </h1>

            <p className="mt-2 text-slate-600">
                Selecciona una fecha para consultar
                sesiones disponibles de 60 minutos.
            </p>

            <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
                <div>
                    <label
                        htmlFor="date"
                        className="mb-1 block text-sm font-medium"
                    >
                        Fecha
                    </label>

                    <input
                        id="date"
                        name="date"
                        type="date"
                        min={today}
                        defaultValue={selectedDate}
                        required
                        className="rounded-lg border border-slate-300 p-3"
                    />
                </div>

                <button
                    type="submit"
                    className="rounded-lg bg-[#2457e8] px-5 py-3 font-semibold text-white"
                >
                    Ver horarios
                </button>
            </form>

            <h2 className="mt-8 text-lg font-semibold">
                Horarios disponibles
            </h2>

            {slots.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-100 p-4 text-slate-600">
                    No hay horarios libres para esta fecha.
                </p>
            ) : (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {slots.map((slot) => (
                        <li
                            key={slot}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center font-medium text-blue-900"
                        >
                            {new Date(slot).toLocaleTimeString("es-PE", {
                                timeZone: "America/Lima",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                            })}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}

function BookPage(props: BookPageProps) {
    return (
        <div>
            <Suspense fallback={
                <p className="text-center text-xl font-bold mt-4 text-slate-500">Cargando reservas...</p>
            }>
                <BookContent
                    {...props}
                />
            </Suspense>
        </div>

    );
}

export default BookPage;