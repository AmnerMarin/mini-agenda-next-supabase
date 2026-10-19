
import { expect, test } from "vitest";
import { computeDaySlots } from "./computeDaySlots";

const fecha = {
    dia: "2026-10-19",
    ahora: "2026-10-18T12:00:00Z"
};

const regla = {
    weekday: 1,
    start_time: "09:00:00",
    end_time: "12:00:00"
};

test("Día sin reglas: no devuelve horarios", () => {
    const result = computeDaySlots([], [], fecha);

    expect(result).toEqual([]);
});

test("Varias franjas: genera sesiones de 60 minutos", () => {
    const result = computeDaySlots(
        [
            regla,
            {
                weekday: 1,
                start_time: "15:00:00",
                end_time: "17:00:00"
            }
        ],
        [],
        fecha
    );

    expect(result).toEqual([
        "2026-10-19T14:00:00.000Z",
        "2026-10-19T15:00:00.000Z",
        "2026-10-19T16:00:00.000Z",
        "2026-10-19T20:00:00.000Z",
        "2026-10-19T21:00:00.000Z"
    ]);
});

test("Reservas activas: ocupan horarios", () => {
    const result = computeDaySlots(
        [regla],
        [
            {
                starts_at: "2026-10-19T14:00:00Z",
                ends_at: "2026-10-19T15:00:00Z",
                status: "PENDING"
            },
            {
                starts_at: "2026-10-19T15:00:00Z",
                ends_at: "2026-10-19T16:00:00Z",
                status: "CONFIRMED"
            }
        ],
        fecha
    );

    expect(result).toEqual([
        "2026-10-19T16:00:00.000Z"
    ]);
});

test("Reservas canceladas: liberan sus horarios", () => {
    const result = computeDaySlots(
        [regla],
        [
            {
                starts_at: "2026-10-19T14:00:00Z",
                ends_at: "2026-10-19T15:00:00Z",
                status: "CANCELLED"
            }
        ],
        fecha
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toBe("2026-10-19T14:00:00.000Z");
});

test("Horarios pasados del día actual: se descartan", () => {
    const result = computeDaySlots(
        [
            {
                weekday: 1,
                start_time: "09:00:00",
                end_time: "13:00:00"
            }
        ],
        [],
        {
            dia: "2026-10-19",
            ahora: "2026-10-19T15:30:00Z"
        }
    );

    expect(result).toEqual([
        "2026-10-19T16:00:00.000Z",
        "2026-10-19T17:00:00.000Z"
    ]);
});

test("Una reserva parcialmente superpuesta bloquea el hueco", () => {
    const result = computeDaySlots(
        [regla],
        [
            {
                starts_at: "2026-10-19T14:30:00Z",
                ends_at: "2026-10-19T15:30:00Z",
                status: "PENDING"
            }
        ],
        fecha
    );

    expect(result).toEqual([
        "2026-10-19T16:00:00.000Z"
    ]);
});