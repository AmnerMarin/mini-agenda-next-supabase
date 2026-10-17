import z from "zod";

export const registerSchema = z.object({
    full_name: z.string()
        .trim()
        .min(1, "El nombre debe ser obligatorio"),

    email: z.email("Correo electrónico inválido"),

    password: z.string()
        .min(8, "Mínimo 8 caracteres")
        .regex(/[A-Z]/, "Debe incluir una mayúscula")
        .regex(/[0-9]/, "Debe incluir un número")
        .regex(/[^A-Za-z0-9\s]/, "Debe incluir un símbolo"),

    role: z.enum(['CLIENT', 'SPECIALIST'])
})

export const onboardingSchema = z.object({
    full_name: z.string()
        .trim()
        .min(1, "El nombre es obligatorio")
        .max(100, "Máximo 100 caracteres"),

    role: z.enum(["CLIENT", "SPECIALIST"])
});

export type RegisterData = z.infer<typeof registerSchema>;