//Mostrar el formulario y sus mensajes.
"use client";

import { useState} from "react";
import { availabilitySchema } from "@/lib/validation/availability";
import { createAvailability } from "./actions";

export function AvailabilityForm() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const values = {
            weekday: formData.get("weekday"),
            start_time: formData.get("start_time"),
            end_time: formData.get("end_time")
        };

        // Comprobar los datos antes de enviarlos
        const validation = availabilitySchema.safeParse(values);

        if (!validation.success) {
            setMessage(
                validation.error.issues[0]?.message ?? "Datos inválidos"
            );
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const result = await createAvailability(values);

            setMessage(result.message);
            setIsError(!result.success);

            if (result.success) {
                form.reset();
            }
        } catch {
            setMessage("Ocurrió un error al guardar");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
            <h2 className="text-lg font-semibold text-[#102449]">
                Agregar horario
            </h2>

            <div>
                <label
                    htmlFor="weekday"
                    className="mb-1 block text-sm font-medium"
                >
                    Día de la semana
                </label>

                <select
                    id="weekday"
                    name="weekday"
                    required
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 p-3"
                >
                    <option value="">Selecciona un día</option>
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                    <option value="0">Domingo</option>
                </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="start_time"
                        className="mb-1 block text-sm font-medium"
                    >
                        Hora de inicio
                    </label>

                    <input
                        id="start_time"
                        name="start_time"
                        type="time"
                        required
                        className="w-full rounded-lg border border-slate-300 p-3"
                    />
                </div>

                <div>
                    <label
                        htmlFor="end_time"
                        className="mb-1 block text-sm font-medium"
                    >
                        Hora de fin
                    </label>

                    <input
                        id="end_time"
                        name="end_time"
                        type="time"
                        required
                        className="w-full rounded-lg border border-slate-300 p-3"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#2457e8] px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? "Guardando..." : "Guardar horario"}
            </button>

            {message && (
                <p
                    role="status"
                    className={isError ? "text-sm text-red-600" : "text-sm text-green-700"}
                >
                    {message}
                </p>
            )}
        </form>
    );
}