"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "./actions";
import { formatTime12h } from "@/lib/utils/formatTime";

type BookingSlotsProps = {
    specialistId: string;
    slots: string[];
};

export function BookingSlots({
    specialistId,
    slots
}: BookingSlotsProps) {
    const router = useRouter();

    const [loadingSlot, setLoadingSlot] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    async function handleBooking(startsAt: string) {
        if (loadingSlot !== null) {
            return;
        }

        setLoadingSlot(startsAt);
        setMessage("");

        try {
            const result = await createBooking({
                specialistId,
                startsAt
            });

            setMessage(result.error ?? result.data?.message ?? "");
            setIsError(Boolean(result.error));

            if (result.data?.refresh) {
                router.refresh();
            }
        } catch {
            setMessage("Ocurrió un error al reservar");
            setIsError(true);
        } finally {
            setLoadingSlot(null);
        }
    }

    return (
        <section className="mt-8">
            <h2 className="text-lg font-semibold text-[#102449]">
                Horarios disponibles
            </h2>

            {slots.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-100 p-4 text-slate-600">
                    No hay horarios libres para esta fecha.
                </p>
            ) : (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {slots.map((slot) => (
                        <li key={slot}>
                            <button
                                type="button"
                                disabled={loadingSlot !== null}
                                onClick={() => handleBooking(slot)}
                                className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4 font-medium text-blue-900 hover:bg-blue-100 disabled:opacity-50"
                            >
                                {loadingSlot === slot
                                    ? "Reservando..."
                                    : formatTime12h(slot)
                                }
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {message && (
                <p
                    role={isError ? "alert" : "status"}
                    className={`mt-4 rounded-lg p-3 text-sm ${isError
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                >
                    {message}
                </p>
            )}
        </section>
    );
}
