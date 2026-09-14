"use client";

import {
  FolderOpen,
  Search,
  Plus,
} from "lucide-react";

export default function Page() {
  const Icon = FolderOpen;

  return (
    <main className="app-page">

      <div className="app-container">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="page-title">
              Documentos
            </h1>

            <p className="page-subtitle">
              Archivos, expedientes y documentación de gestión.
            </p>
          </div>

          <button className="btn-primary">
            <Plus size={17} />
            Nuevo
          </button>

        </div>

        <div className="mt-6 app-card p-4">

          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">

            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Buscar..."
            />

          </div>

        </div>

        <section className="mt-5 app-card p-6">

          <div className="flex min-h-56 flex-col items-center justify-center text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">

              <Icon size={25} />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Esta sección está lista para conectar con los datos.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
