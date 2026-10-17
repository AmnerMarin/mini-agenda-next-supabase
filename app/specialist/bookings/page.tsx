import { LogoutButton } from "@/components";

export default function SpecialistBookingsPage() {
    return (
        <main className="mx-auto max-w-4xl p-8">
            <h1 className="mb-4 text-2xl font-bold">
                Área del especialista
            </h1>

            <p className="mb-6">
                Aquí gestionarás las reservas recibidas.
            </p>

            <LogoutButton />
        </main>
    );
}