'use client'

import { Field } from "@/components";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";



export default function LoginPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;


        setLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);

        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");

        const supabase = supabaseClient();

        const { data, error: loginError } =
            await supabase.auth.signInWithPassword({
                email,
                password
            });

        if (loginError || !data.user) {
            setError("Credenciales incorrectas o correo sin confirmar");
            setLoading(false);
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

        if (profileError || !profile) {
            setError("No se pudo consultar el perfil");
            setLoading(false);
            return;
        }

        form.reset();
        setLoading(false);

        if (profile.role === "CLIENT") {
            router.replace("/client/bookings");
        } else if (profile.role === "SPECIALIST") {
            router.replace("/specialist/bookings");
        } else {
            router.replace("/onboarding");
        }

        router.refresh();
    }

    async function handleGoogleLogin() {
        setError("");

        const supabase = supabaseClient();

        const { error: googleError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (googleError) {
            setError("No se pudo iniciar sesión con Google");
        }
    }
    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-center text-2xl font-bold text-[#102449]">
                    Iniciar sesión
                </h1>

                <p className="mb-8 mt-2 text-center text-sm text-slate-500">
                    Bienvenido a Mini-agenda
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Field
                        name="email"
                        label="Correo electrónico"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        required
                    />

                    <Field
                        name="password"
                        label="Contraseña"
                        type="password"
                        placeholder="Tu contraseña"
                        required
                    />

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
                        {loading ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                </form>
                
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-[#102449] hover:bg-slate-50"
                >
                    Continuar con Google
                </button>

                <p className="mt-6 text-center text-sm text-slate-500">
                    ¿No tienes cuenta?{" "}
                    <Link href="/auth/register" className="font-semibold text-blue-600">
                        Regístrate
                    </Link>
                </p>
            </section>
        </main>
    );
}