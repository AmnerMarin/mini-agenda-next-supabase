import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function HomePage() {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role === "CLIENT") {
        redirect("/client/bookings");
    } else if (profile?.role === "SPECIALIST") {
        redirect("/specialist/bookings");
    } else {
        redirect("/onboarding");
    }
}
