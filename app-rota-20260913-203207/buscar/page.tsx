"use client";

import {
  Search,
  MessageSquareText,
} from "lucide-react";

export default function BuscarPage() {
  return (
    <main className="app-page">

      <div className="app-container">

        <h1 className="page-title">
          Buscar
        </h1>

        <p className="page-subtitle">
          Consultá toda la información institucional.
        </p>

        <div className="mt-6 app-card p-5">

          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">

            <Search
              size={20}
              className="text-slate-400"
            />

            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="¿Qué información necesitás?"
            />

            <button className="btn-primary">
              Buscar
            </button>

          </div>

        </div>

        <div className="mt-5 app-card p-6">

          <div className="flex min-h-64 flex-col items-center justify-center text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <MessageSquareText size={26} />
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Acá aparecerán los resultados y respuestas.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}
