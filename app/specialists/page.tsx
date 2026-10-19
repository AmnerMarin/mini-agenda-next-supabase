import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";

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
                <p role="alert" className="text-red-600">
                    No se pudieron cargar los especialistas.
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto  max-w-4xl p-6">
            <h1 className="text-2xl font-bold text-[#102449]">
                Especiaistas Disponibles
            </h1>
            <p className="mt-2 text-slate-600">
                Encuentra un especialista disponible para atender tu consulta.
            </p>

            {
                specialists?.length === 0 ?
                    <p className="mt-6 rounded-lg bg-blue-50 p-4 text-blue-800">
                        Todavía no hay especialistas disponibles.
                    </p>
                    :
                    <div className="gap-3 grid mt-6 sm:grid-cols-2">
                        {specialists.map((specialist) => {
                            return (
                                <article
                                    key={specialist.id}
                                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h2
                                        className="text-lg font-semibold text-[#102449]">{specialist.full_name}</h2>
                                    <p className="mt-2 text-sm text-slate-600">Especialista</p>
                                    <Link
                                        href={`/book/${specialist.id}`}
                                        className="mt-4 inline-block rounded-lg bg-[#2457e8] px-4 py-2 font-semibold text-white hover:bg-blue-700"
                                    >
                                        Ver horarios
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
            }
        </main>
    );
}

function SpecialistsPage() {
    return (
        <main>
            <Suspense fallback={<p className="text-center text-xl font-bold mt-4 text-slate-500">Cargando especialistas...</p>}>
                <SpecialistsContent />
            </Suspense>
        </main>
    );
}

export default SpecialistsPage;