
type Role = "CLIENT" | "SPECIALIST";

type Props = {
    initial?: Role;
};

export function RoleSelector({ initial }: Props) {
    const choices = [
        {
            value: "CLIENT",
            label: "Cliente",
            help: "Quiero reservar sesiones",
        },
        {
            value: "SPECIALIST",
            label: "Especialista",
            help: "Quiero recibir reservas",
        },
    ];

    return (
        <fieldset>
            <legend className="mb-5 text-xl font-bold text-[#102449]">
                ¿Cómo usarás la agenda?
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {choices.map((choice) => (
                    <label
                        key={choice.value}
                        className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 has-checked:border-[#2457e8] has-checked:bg-[#edf2ff]"
                    >
                        <input
                            type="radio"
                            name="role"
                            value={choice.value}
                            defaultChecked={initial === choice.value}
                            required
                            className="mt-1 h-4 w-4  accent-[#2457e8]"
                        />

                        <span className="flex flex-col gap-1">
                            <strong className="text-sm text-[#102449]">
                                {choice.label}
                            </strong>

                            <small className="text-xs text-slate-500">
                                {choice.help}
                            </small>
                        </span>
                    </label>
                ))}
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
                El rol se elige una sola vez.
            </p>
            
        </fieldset>
    );
}
