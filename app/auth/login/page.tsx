"use client";

import { Field } from "@/components";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { LuCalendarCheck, LuCircleCheck, LuCircleAlert } from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const confirmed = searchParams.get("confirmed");
    const registered = searchParams.get("registered");
    const errorParam = searchParams.get("error");

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;

        setLoading(true);
        setError("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "");
        const password = String(formData.get("password") ?? "");

        const supabase = supabaseClient();

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
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
        <main className="flex min-h-screen items-center justify-center px-4 py-8">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-center mb-6">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                        <LuCalendarCheck className="w-6 h-6" />
                    </span>
                    <h1 className="text-2xl font-bold text-[#102449]">
                        Iniciar sesión
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Bienvenido a Mini-agenda
                    </p>
                </div>

                {confirmed && (
                    <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-sm text-emerald-800 flex items-center gap-2">
                        <LuCircleCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Tu correo ha sido confirmado. Ya puedes iniciar sesión.</span>
                    </div>
                )}

                {registered && (
                    <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-3.5 text-sm text-blue-800 flex items-center gap-2">
                        <LuCircleCheck className="w-5 h-5 text-blue-600 shrink-0" />
                        <span>Cuenta creada exitosamente. Ingresa tus credenciales.</span>
                    </div>
                )}

                {errorParam === "confirmation" && (
                    <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-800 flex items-center gap-2">
                        <LuCircleAlert className="w-5 h-5 text-red-600 shrink-0" />
                        <span>El enlace de confirmación no es válido o ha expirado.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <p role="alert" className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#2457e8] px-4 py-3 font-semibold text-white hover:bg-blue-700 transition active:scale-[0.99] disabled:opacity-50"
                    >
                        {loading ? "Ingresando..." : "Iniciar sesión"}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-400 font-medium">O continúa con</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-[#102449] hover:bg-slate-50 transition active:scale-[0.99]"
                >
                    <FcGoogle className="h-5 w-5 shrink-0" />
                    <span>Continuar con Google</span>
                </button>

                <p className="mt-6 text-center text-sm text-slate-500">
                    ¿No tienes cuenta?{" "}
                    <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700">
                        Regístrate gratis
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-400">Cargando...</div>}>
            <LoginForm />
        </Suspense>
    );
}