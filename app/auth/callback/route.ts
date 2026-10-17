
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(
            new URL("/auth/login", url.origin)
        );
    }

    const supabase = await supabaseServer();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(
            new URL("/auth/login", url.origin)
        );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(
            new URL("/auth/login", url.origin)
        );
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    let destination = "/onboarding";

    if (profile?.role === "CLIENT") {
        destination = "/client/bookings";
    }

    if (profile?.role === "SPECIALIST") {
        destination = "/specialist/bookings";
    }

    return NextResponse.redirect(
        new URL(destination, url.origin)
    );
}