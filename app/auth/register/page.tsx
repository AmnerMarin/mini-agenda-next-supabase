'use client'
import { Field, RoleSelector } from "@/components";
import { registerSchema } from "@/lib/validation/auth";
import { useState } from "react";
import z from "zod";

function RegisterPage() {

    type FormErrors = {
        full_name?: string;
        email?: string;
        password?: string;
        role?: string;
    };

    const [errors, setErrors] = useState<FormErrors>({});
    const [message, setMessage] = useState("");


    //Conectar con la API
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setMessage("");
        setServerError("");
        setErrors({});

        const formData = new FormData(event.currentTarget);

        const values = {
            full_name: formData.get("full_name"),
            email: formData.get("email"),
            password: formData.get("password"),
            role: formData.get("role")
        };

        //Validación en el navegador
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
                setServerError(data.error ?? "Error al registrar");
                return;
            }

        } catch {
            setServerError("No se pudo conectar con el servidor");
        } finally {
            setLoading(false);
        }

        setErrors({});
        setMessage("Formulario válido. Listo para registrar.");
    }

    return (
        <div className="min-h-screen px-4 py-12">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h1 className="text-center text-2xl font-bold text-[#102449]">Crear Cuenta</h1>
                <form
                    noValidate
                    onSubmit={handleSubmit}
                    className="space-y-5">
                    <Field
                        name="full_name"
                        label="Nombre completo"
                        placeholder="Carlos Pérez"
                        error={errors.full_name}
                        required>

                    </Field>

                    <Field
                        name="email"
                        label="Correo Electrónico"
                        placeholder="example123@gmail.com"
                        error={errors.email}
                        required>
                    </Field>

                    <Field
                        name="password"
                        label="Contraseña"
                        placeholder="Tu contraseña"
                        error={errors.password}
                        required>
                    </Field>

                    <RoleSelector />

                    {errors.role && (
                        <p className="mt-2 text-sm text-red-600" role="alert">
                            {errors.role}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-[#2457e8] px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-75 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Registarndo..." : "Crear Cuenta"}
                    </button>

                    {message && (
                        <p className="text-center text-sm text-green-700" role="status">
                            {message}
                        </p>
                    )}

                    {serverError && (
                        <p role="alert" className="text-center text-sm text-red-600">
                            {serverError}
                        </p>
                    )}

                </form>
            </div>
        </div>
    );
}

export default RegisterPage;