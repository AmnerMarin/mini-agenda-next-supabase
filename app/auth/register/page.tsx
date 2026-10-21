"use client";

import { Field, RoleSelector } from "@/components";
import { registerSchema } from "@/lib/validation/auth";
import Link from "next/link";
import { useState } from "react";
import z from "zod";
import { LuSparkles, LuMail, LuArrowLeft } from "react-icons/lu";

function RegisterPage() {
    type FormErrors = {
        full_name?: string;
        email?: string;
        password?: string;
        role?: string;
    };

    const [errors, setErrors] = useState<FormErrors>({});
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setServerError("");
        setErrors({});

        const formData = new FormData(event.currentTarget);

        const values = {
            full_name: formData.get("full_name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role: formData.get("role")
        };

        // Validación en el navegador
        const result = registerSchema.safeParse(values);

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                full_name: fieldErrors.full_name?.[0],
                email: fieldErrors.email?.[0],
                password: fieldErrors.password?.[0],
                role: fieldErrors.role?.[0]
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(result.data)
            });

            const data: {
                message?: string;
                error?: string;
            } = await response.json();

            if (!response.ok) {
                setServerError(data.error ?? "Error al registrar la cuenta");
                return;
            }

            setIsRegistered(true);
            setErrors({});
        } catch {
            setServerError("No se pudo conectar con el servidor. Verifica tu conexión.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="text-center mb-6">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3">
                        <LuSparkles className="w-6 h-6" />
                    </span>
                    <h1 className="text-2xl font-bold text-[#102449]">Crear Cuenta</h1>
                    <p className="mt-1 text-sm text-slate-500">Únete a Mini-agenda</p>
                </div>

                {isRegistered ? (
                    <div className="space-y-4 py-4 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <LuMail className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-[#102449]">
                                Revisa tu correo
                            </h2>
                            <p className="text-sm text-slate-600">
                                Hemos enviado un enlace a tu bandeja de entrada para verificar tu cuenta.
                            </p>
                        </div>
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistered(false);
                                    setServerError("");
                                    setErrors({});
                                }}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                            >
                                <LuArrowLeft className="w-4 h-4" />
                                <span>Registrar otra cuenta</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <form noValidate onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            name="full_name"
                            label="Nombre completo"
                            placeholder="Carlos Pérez"
                            error={errors.full_name}
                            required
                        />

                        <Field
                            name="email"
                            label="Correo Electrónico"
                            type="email"
                            placeholder="ejemplo@gmail.com"
                            error={errors.email}
                            required
                        />

                        <Field
                            name="password"
                            label="Contraseña"
                            type="password"
                            placeholder="Crea una contraseña segura"
                            error={errors.password}
                            required
                        />

                        <RoleSelector />

                        {errors.role && (
                            <p className="text-sm text-red-600" role="alert">
                                {errors.role}
                            </p>
                        )}

                        {serverError && (
                            <p role="alert" className="text-center text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                                {serverError}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[#2457e8] px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Registrando..." : "Crear Cuenta"}
                        </button>

                        <p className="mt-4 text-center text-sm text-slate-500">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
                                Inicia sesión
                            </Link>
                        </p>
                    </form>
                )}
            </div>
        </main>
    );
}

export default RegisterPage;