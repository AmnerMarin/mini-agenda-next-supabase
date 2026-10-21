import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components";
import { LuArrowLeft, LuCalendar } from "react-icons/lu";

async function SpecialistsContent() {
    await connection();

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

    const { data: specialists, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "SPECIALIST")
        .order("full_name", { ascending: true });

    if (error) {
        return (
            <main className="p-6">
                <p role="alert" className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                    No se pudieron cargar los especialistas.
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-4xl p-6">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <Link
                        href="/client/bookings"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                        <LuArrowLeft className="w-4 h-4" />
                        <span>Volver a Mis reservas</span>
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-[#102449]">
                        Especialistas Disponibles
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Selecciona un especialista para consultar sus horarios y reservar tu sesión.
                    </p>
                </div>
                <LogoutButton />
            </header>

            {specialists?.length === 0 ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-8 text-center text-blue-900">
                    <p className="font-medium">Todavía no hay especialistas disponibles.</p>
                    <p className="mt-1 text-sm text-blue-700">Por favor, vuelve a consultar más tarde.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {specialists.map((specialist) => {
                        const initial = specialist.full_name?.trim()?.charAt(0)?.toUpperCase() ?? "E";
                        return (
                            <article
                                key={specialist.id}
                                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                                        {initial}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-bold text-[#102449] truncate">
                                            {specialist.full_name}
                                        </h2>
                                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                            Especialista
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-slate-100 pt-4">
                                    <Link
                                        href={`/book/${specialist.id}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2457e8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
                                    >
                                        <LuCalendar className="w-4 h-4" />
                                        <span>Ver horarios disponibles</span>
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

export default function SpecialistsPage() {
    return (
        <Suspense fallback={<p className="text-center text-xl font-bold mt-12 text-slate-500">Cargando especialistas...</p>}>
            <SpecialistsContent />
        </Suspense>
    );
}