"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { LuLogOut } from "react-icons/lu";

export function LogoutButton() {
    const router = useRouter();

    const [error, setError] = useState("");

    async function handleLogout() {
        setError("");

        const supabase = supabaseClient();

        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
            setError("No se pudo cerrar sesión");
            return;
        }

        router.replace("/auth/login");
        router.refresh();
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 font-medium transition"
            >
                <LuLogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
            </button>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}