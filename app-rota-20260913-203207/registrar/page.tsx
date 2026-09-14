"use client";

import {
  PenLine,
  Mic,
  Upload,
  Save,
} from "lucide-react";

export default function RegistrarPage() {
  return (
    <main className="app-page">

      <div className="app-container">

        <h1 className="page-title">
          Registrar
        </h1>

        <p className="page-subtitle">
          Incorporá nueva información a la gestión.
        </p>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">

          <button className="app-card app-card-hover p-6 text-left">

            <PenLine
              size={24}
              className="text-cyan-700"
            />

            <h2 className="mt-4 font-semibold">
              Escribir registro
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Notas, novedades y datos.
            </p>

          </button>

          <button className="app-card app-card-hover p-6 text-left">

            <Mic
              size={24}
              className="text-cyan-700"
            />

            <h2 className="mt-4 font-semibold">
              Grabar audio
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Registrar información por voz.
            </p>

          </button>

          <button className="app-card app-card-hover p-6 text-left">

            <Upload
              size={24}
              className="text-cyan-700"
            />

            <h2 className="mt-4 font-semibold">
              Subir archivo
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Excel, Word, PDF o imágenes.
            </p>

          </button>

        </section>

        <section className="mt-5 app-card p-6">

          <label className="text-sm font-semibold">
            Registro
          </label>

          <textarea
            rows={8}
            className="field mt-3 resize-none"
            placeholder="Escribí información institucional..."
          />

          <div className="mt-4 flex justify-end">

            <button className="btn-primary">
              <Save size={17} />
              Guardar
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}
