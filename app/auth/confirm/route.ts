import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const tokenHash = url.searchParams.get("token_hash");

    if (!tokenHash) {
        return NextResponse.redirect(
            new URL("/auth/login?error=confirmation", url.origin)
        );
    }

    const supabase = await supabaseServer();

    const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email"
    });

    if (error) {
        return NextResponse.redirect(
            new URL("/auth/login?error=confirmation", url.origin)
        );
    }

    return NextResponse.redirect(
        new URL("/auth/login?confirmed=1", url.origin)
    );
}