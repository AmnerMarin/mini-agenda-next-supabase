
"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

type AddToCalendarButtonProps = {
    bookingId: string;
};

export function AddToCalendarButton({
    bookingId
}: AddToCalendarButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleDownload() {
        if (loading) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const supabase = supabaseClient();

            const { data, error: functionError } =
                await supabase.functions.invoke<string>("booking-ics", {
                    body: {
                        bookingId
                    }
                });

            if (functionError || typeof data !== "string") {
                setError("No se pudo descargar el calendario");
                return;
            }

            const file = new Blob([data], {
                type: "text/calendar;charset=utf-8"
            });

            const url = URL.createObjectURL(file);

            const link = document.createElement("a");
            link.href = url;
            link.download = `reserva-${bookingId}.ics`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } catch {
            setError("Ocurrió un error durante la descarga");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={handleDownload}
                disabled={loading}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
                {loading
                    ? "Descargando..."
                    : "Añadir a mi calendario"}
            </button>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}