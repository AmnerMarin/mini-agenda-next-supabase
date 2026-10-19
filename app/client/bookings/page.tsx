import { LogoutButton } from "@/components";
import Link from "next/link";

export default function ClientBookingsPage() {
    return (
        <main className="mx-auto max-w-4xl p-8">
            <h1 className="mb-4 text-2xl font-bold">
                Área del cliente
            </h1>

            <p className="mb-6">
                Aquí se mostrarán tus reservas.
            </p>

            <Link
                href="/specialists"
                className="inline-block rounded-lg bg-[#2457e8] px-4 py-3 font-semibold text-white hover:bg-blue-700 mb-3" 
            >
                Buscar especialistas
            </Link>
            <LogoutButton/>
        </main>
    );
}