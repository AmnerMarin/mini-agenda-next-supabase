
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "./actions";
import { LuCircleX } from "react-icons/lu";

type CancelBookingButtonProps = {
    bookingId: string;
};

export function CancelBookingButton({
    bookingId
}: CancelBookingButtonProps) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCancel() {
        const confirmed = window.confirm(
            "¿Seguro que deseas cancelar esta reserva?"
        );

        if (!confirmed) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await cancelBooking(bookingId);

            if (result.success) {
                router.refresh();
            } else {
                setError(result.message);
            }
        } catch {
            setError("Ocurrió un error al cancelar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition"
            >
                <LuCircleX className="w-4 h-4" />
                <span>{loading ? "Cancelando..." : "Cancelar reserva"}</span>
            </button>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}