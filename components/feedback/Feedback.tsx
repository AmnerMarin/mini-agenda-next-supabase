type Props = {
    kind: "loading" | "empty" | "error";
    message: string;
    retry?: () => void;
};

export function Feedback({ kind, message, retry }: Props) {
    const isError = kind === "error";

    return (
        <section className={`rounded-xl border p-5 ${isError ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
            <p className="font-semibold text-[#102449]">{message}</p>

            {kind === "loading" && (
                <div className="mt-4 h-12 animate-pulse rounded-lg bg-slate-200" />
            )}

            {retry && (
                <button onClick={retry} className="mt-4 w-full rounded-lg bg-[#2457e8] px-4 py-2.5 font-semibold text-white hover:bg-[#1c43b3] active:scale-95">
                    Reintentar
                </button>
            )}
        </section>
    );
}