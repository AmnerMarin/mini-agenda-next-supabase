
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { availabilitySchema } from "@/lib/validation/availability";
import { updateAvailability, deleteAvailability } from "./actions";

type AvailabilityItemProps = {
    rule: {
        id: string;
        weekday: number;
        start_time: string;
        end_time: string;
    };
};

export function AvailabilityItem({ rule }: AvailabilityItemProps) {
    const router = useRouter();

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    async function handleEdit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const values = {
            weekday: formData.get("weekday"),
            start_time: formData.get("start_time"),
            end_time: formData.get("end_time")
        };

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
            const result = await updateAvailability(rule.id, values);

            setMessage(result.message);
            setIsError(!result.success);

            if (result.success) {
                setEditing(false);
                router.refresh();
            }
        } catch {
            setMessage("No se pudo actualizar el horario");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        const confirmed = window.confirm(
            "¿Seguro que deseas eliminar este horario?"
        );

        if (!confirmed) {
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const result = await deleteAvailability(rule.id);

            setMessage(result.message);
            setIsError(!result.success);

            if (result.success) {
                router.refresh();
            }
        } catch {
            setMessage("No se pudo eliminar el horario");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-lg bg-blue-50 p-3">
            {!editing ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-blue-900">
                        {rule.start_time.slice(0, 5)}
                        {" – "}
                        {rule.end_time.slice(0, 5)}
                    </span>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                                setEditing(true);
                                setMessage("");
                            }}
                            className="rounded border border-blue-300 px-3 py-1 text-sm text-blue-700"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleDelete}
                            className="rounded border border-red-300 px-3 py-1 text-sm text-red-700"
                        >
                            {loading ? "Eliminando..." : "Eliminar"}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleEdit} className="space-y-3">
                    <div>
                        <label htmlFor={`day-${rule.id}`} className="block text-sm">
                            Día
                        </label>

                        <select
                            id={`day-${rule.id}`}
                            name="weekday"
                            defaultValue={rule.weekday}
                            className="w-full rounded border p-2"
                        >
                            <option value="1">Lunes</option>
                            <option value="2">Martes</option>
                            <option value="3">Miércoles</option>
                            <option value="4">Jueves</option>
                            <option value="5">Viernes</option>
                            <option value="6">Sábado</option>
                            <option value="0">Domingo</option>
                        </select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor={`start-${rule.id}`} className="block text-sm">
                                Inicio
                            </label>

                            <input
                                id={`start-${rule.id}`}
                                name="start_time"
                                type="time"
                                defaultValue={rule.start_time.slice(0, 5)}
                                required
                                className="w-full rounded border p-2"
                            />
                        </div>

                        <div>
                            <label htmlFor={`end-${rule.id}`} className="block text-sm">
                                Fin
                            </label>

                            <input
                                id={`end-${rule.id}`}
                                name="end_time"
                                type="time"
                                defaultValue={rule.end_time.slice(0, 5)}
                                required
                                className="w-full rounded border p-2"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                        >
                            {loading ? "Guardando..." : "Guardar cambios"}
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                                setEditing(false);
                                setMessage("");
                            }}
                            className="rounded border px-3 py-2 text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {message && (
                <p
                    role="status"
                    className={`mt-2 text-sm ${isError ? "text-red-600" : "text-green-700"
                        }`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}