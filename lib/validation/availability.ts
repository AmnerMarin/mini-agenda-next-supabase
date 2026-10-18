//Validar el día y las horas con zod

import z from "zod";

export const availabilitySchema = z.object({
    weekday: z.enum(["0", "1", "2", "3", "4", "5", "6"])
        .transform((value) => Number(value)),

    start_time: z.string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora de inicio inválida"),

    end_time: z.string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora de fin inválida")
}).refine(
    (data) => data.end_time > data.start_time,
    {
        message: "La hora de fin debe ser posterior a la de inicio",
        path: ["end_time"]
    }
);