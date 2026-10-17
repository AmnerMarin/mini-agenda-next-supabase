"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export function LogoutButton() {
    const router = useRouter();

    const [error, setError] = useState("");

    async function handleLogout() {
        setError("");

        const supabase = supabaseClient();

        await supabase.auth.signOut();

        router.replace("/auth/login");
        router.refresh();
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
                Cerrar sesión
            </button>

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}