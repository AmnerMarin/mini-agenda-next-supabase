import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const tokenHash = url.searchParams.get("token_hash");
    const type = (url.searchParams.get("type") as EmailOtpType) || "email";
    const code = url.searchParams.get("code");

    const supabase = await supabaseServer();

    if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type
        });

        if (!error) {
            return NextResponse.redirect(
                new URL("/auth/login?confirmed=1", url.origin)
            );
        }
    }

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(
                new URL("/auth/login?confirmed=1", url.origin)
            );
        }
    }

    return NextResponse.redirect(
        new URL("/auth/login?error=confirmation", url.origin)
    );
}