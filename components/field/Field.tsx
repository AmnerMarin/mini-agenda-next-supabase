"use client";

import { ComponentProps, useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

type Props = ComponentProps<"input"> & {
    label: string;
    error?: string;
};

export function Field({ label, id, error, type = "text", ...input }: Props) {
    const fieldId = id ?? input.name;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="space-y-1">
            <label
                htmlFor={fieldId}
                className="flex text-sm font-semibold text-[#102449]"
            >
                {label}
            </label>

            <div className="relative">
                <input
                    {...input}
                    id={fieldId}
                    type={inputType}
                    aria-invalid={Boolean(error)}
                    className={`
                        block w-full min-h-11 px-3 border rounded-lg py-2.5 bg-white text-sm text-[#102449] outline-none transition focus:border-[#2457e8] focus:ring-2 focus:ring-[#2457e8]/20
                        ${isPassword ? "pr-10" : ""}
                        ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-300"}
                    `}
                />

                {isPassword && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition p-1"
                        aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                        {showPassword ? (
                            <LuEyeOff className="h-5 w-5" />
                        ) : (
                            <LuEye className="h-5 w-5" />
                        )}
                    </button>
                )}
            </div>

            {error ? (
                <small id={`${fieldId}-error`} className="text-sm text-red-500 block">
                    {error}
                </small>
            ) : null}
        </div>
    );
}

export default Field;