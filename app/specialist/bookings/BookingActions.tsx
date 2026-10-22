
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatus } from "./actions";
import { LuCheck, LuX, LuCircleCheck } from "react-icons/lu";

type BookingActionsProps = {
    bookingId: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
    canComplete: boolean;
};

type ActionStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export function BookingActions({
    bookingId,
    status,
    canComplete
}: BookingActionsProps) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleAction(newStatus: ActionStatus) {
        if (loading) {
            return;
        }

        if (newStatus === "CANCELLED") {
            const confirmed = window.confirm(
                "¿Seguro que deseas rechazar esta reserva?"
            );

            if (!confirmed) {
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            const result = await updateBookingStatus({
                bookingId,
                status: newStatus
            });

            if (result.data) {
                router.refresh();
            } else {
                setError(result.error ?? "No se pudo actualizar la reserva");
            }
        } catch {
            setError("Ocurrió un error al actualizar la reserva");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4">
            {status === "PENDING" && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAction("CONFIRMED")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        <LuCheck className="w-4 h-4" />
                        <span>Confirmar</span>
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleAction("CANCELLED")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                    >
                        <LuX className="w-4 h-4" />
                        <span>Rechazar</span>
                    </button>
                </div>
            )}

            {status === "CONFIRMED" && canComplete && (
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction("COMPLETED")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                    <LuCircleCheck className="w-4 h-4" />
                    <span>Marcar como completada</span>
                </button>
            )}

            {loading && (
                <p role="status" className="mt-2 text-sm text-slate-600">
                    Actualizando...
                </p>
            )}

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
