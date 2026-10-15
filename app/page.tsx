'use client';

import { Field, RoleSelector,Feedback } from "@/components";
import { useState } from "react";

export default function Home() {
const [errorMessage, setErrorMessage] = useState(
    "No pudimos guardar la reserva."
  );

  function handleRetry() {
    setErrorMessage(
      "Reintento solicitado. Aún no hay una conexión con Supabase."
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10 text-center">
        <p className="text-sm font-semibold text-[#2457e8]">
          APP2GROW · MINI-AGENDA
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#102449] sm:text-4xl">
          Componentes de nuestra aplicación
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          Día 1: campos accesibles, selección de rol y estados
          de una interfaz.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-bold">
            Campos del formulario
          </h2>

          <div className="space-y-5">
            <Field
              name="fullName"
              label="Nombre completo"
              type="text"
              placeholder="Tu nombre"
            />

            <Field
              name="email"
              label="Correo electrónico"
              type="email"
              placeholder="ana@ejemplo.com"
            />

            <Field
              name="password"
              label="Contraseña"
              type="password"
              placeholder="Ingresa tu contraseña"
              error="Usa 8 caracteres, una mayúscula, un número y un símbolo."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <RoleSelector />
        </section>
      </div>

      <section className="mt-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-[#102449]">
          Carga, vacío y error
        </h2>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
          <Feedback
            kind="loading"
            message="Cargando horarios..."
          />

          <Feedback
            kind="empty"
            message="No hay horarios disponibles. Prueba con otra fecha."
          />

          <Feedback
            kind="error"
            message={errorMessage}
            retry={handleRetry}
          />
        </div>
      </section>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
        Mini-agenda · Práctica de componentes · Día 1
      </footer>
    </main>
  )
}
