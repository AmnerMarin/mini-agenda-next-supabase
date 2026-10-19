type Regla = {
    weekday: number;
    start_time: string;
    end_time: string;
};

type Reserva = {
    starts_at: string;
    ends_at: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
};

type Fecha = {
    dia: string;
    ahora: string;
};

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}


export function computeDaySlots(
    reglas: Regla[],
    reservas: Reserva[],
    fecha: Fecha
): string[] {
    const diaSemana = new Date(
        `${fecha.dia}T12:00:00Z`
    ).getUTCDay();

    const ahora = new Date(fecha.ahora).getTime();

    const reservasActivas = reservas.filter(
        (reserva) =>
            reserva.status === "PENDING" ||
            reserva.status === "CONFIRMED"
    );

    const horarios: string[] = [];

    for (const regla of reglas) {
        if (regla.weekday !== diaSemana) {
            continue;
        }

        const inicio = toMinutes(regla.start_time);
        const fin = toMinutes(regla.end_time);

        for (let minuto = inicio; minuto + 60 <= fin; minuto += 60) {
            const hora = String(Math.floor(minuto / 60)).padStart(2, "0");
            const minutos = String(minuto % 60).padStart(2, "0");

            const empieza = new Date(
                `${fecha.dia}T${hora}:${minutos}:00-05:00`
            );

            const termina = new Date(
                empieza.getTime() + 60 * 60 * 1000
            );

            if (empieza.getTime() <= ahora) {
                continue;
            }

            const ocupado = reservasActivas.some((reserva) => {
                const inicioReserva = new Date(reserva.starts_at).getTime();
                const finReserva = new Date(reserva.ends_at).getTime();

                return (
                    empieza.getTime() < finReserva &&
                    termina.getTime() > inicioReserva
                );
            });

            if (!ocupado) {
                horarios.push(empieza.toISOString());
            }
        }
    }

    return horarios.sort();
}