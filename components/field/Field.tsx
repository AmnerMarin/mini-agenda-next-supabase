import { ComponentProps } from "react";

type Props = ComponentProps<"input"> & {
    label: string,
    error?: string
}

export function Field({ label, id, error, ...input }: Props) {

    const fieldId = id ?? input.name;

    return (
        <div className="space-y-1" >
            <label
                htmlFor={fieldId}
                className="flex text-sm font-semibold text-[#102449]">
                {label}
            </label>

            <input
                {...input}
                id={fieldId}
                type={input.type}
                aria-invalid={Boolean(error)}
                className={`
                    block w-full min-h-11 px-3 border rounded-lg py-2.5 bg-white text-sm text-[#102449] outline-none transition focus:border-[#2457e8] focus:ring-2 focus:ring-[#2457e8]/20
                    ${error ? "border-red-500" : "border-slate-300"}
                `}
            />

            {error ?
                <small
                    id={`${fieldId}-error`}
                    className="text-sm text-red-500"
                >{error}</small> : ""
            }
        </div >
    );
}

export default Field;