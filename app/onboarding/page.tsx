
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, RoleSelector } from "@/components";
import { completeOnboarding } from "./actions";

export default function OnboardingPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);

        const values = {
            full_name: formData.get("full_name"),
            role: formData.get("role")
        };

        try {
            const result = await completeOnboarding(values);

            if (result.error || !result.data) {
                setError(result.error ?? "No se pudo guardar");
                return;
            }

            const destination = result.data.role === "CLIENT"
                ? "/client/bookings"
                : "/specialist/bookings";

            router.replace(destination);
            router.refresh();

        } catch {
            setError("No se pudo completar el perfil");

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen px-4 py-12">
            <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <h1 className="text-2xl font-bold text-[#102449]">
                    Completa tu perfil
                </h1>

                <p className="text-sm text-slate-500">
                    Indica tu nombre y el rol que utilizarás.
                    No podrás cambiar tu rol después.
                </p>

                <Field
                    name="full_name"
                    label="Nombre completo"
                    required
                />

                <RoleSelector />

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-[#2457e8] px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Guardando..." : "Continuar"}
                </button>
            </form>
        </main>
    );
}