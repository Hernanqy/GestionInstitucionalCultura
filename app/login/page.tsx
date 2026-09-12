"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    let email = "";

    if (usuario.trim().toLowerCase() === "peron") {
      email = "peron@gestion.local";
    } else {
      setError("Usuario incorrecto.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-200 p-4 text-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-400 bg-white p-7 shadow-lg">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
          <LockKeyhole size={22} />
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-slate-950">
          Gestión Institucional
        </h1>

        <form
          onSubmit={ingresar}
          className="mt-6 space-y-4"
          autoComplete="off"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-950">
              Usuario
            </label>

            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoComplete="off"
              placeholder="Peron"
              className="w-full rounded-xl border border-slate-400 bg-white px-4 py-3 text-slate-950 outline-none placeholder:text-slate-950 focus:border-cyan-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-950">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-400 bg-white px-4 py-3 text-slate-950 outline-none focus:border-cyan-600"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-[#173c5d] disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

      </div>
    </main>
  );
}


