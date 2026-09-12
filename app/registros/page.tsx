"use client";

import {
  Search,
  FileText,
  Building2,
  Clock3,
  Loader2,
  NotebookPen,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
  created_at: string;

  dependencia: {
    id: string;
    nombre: string;
  } | null;
};

function fecha(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RegistrosPage() {
  const supabase = createClient();

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [buscar, setBuscar] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("registros")
        .select(`
          id,
          titulo,
          contenido,
          tipo,
          created_at,
          dependencia:dependencias(
            id,
            nombre
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!error) {
        setRegistros((data || []) as Registro[]);
      }

      setCargando(false);
    }

    cargar();
  }, []);

  const tipos = useMemo(() => {
    const lista = registros
      .map((r) => r.tipo)
      .filter((x): x is string => Boolean(x));

    return [
      "Todos",
      ...Array.from(new Set(lista)).sort(),
    ];
  }, [registros]);

  const visibles = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    return registros.filter((registro) => {
      const contenido = [
        registro.titulo,
        registro.contenido,
        registro.tipo,
        registro.dependencia?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideTexto =
        contenido.includes(texto);

      const coincideTipo =
        tipo === "Todos" ||
        registro.tipo === tipo;

      return coincideTexto && coincideTipo;
    });
  }, [registros, buscar, tipo]);

  return (
    <AppShell activo="Registros">

      <header className="border-b border-slate-300 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold">
            Registros
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <section className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total de registros
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {registros.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Resultados visibles
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {visibles.length}
            </p>
          </div>

        </section>

        <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">

            <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">

              <Search
                size={18}
                className="text-slate-400"
              />

              <input
                value={buscar}
                onChange={(e) =>
                  setBuscar(e.target.value)
                }
                placeholder="Buscar registros..."
                className="w-full bg-transparent text-sm outline-none"
              />

            </div>

            <select
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value)
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              {tipos.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

          </div>

        </section>

        <section className="mt-5">

          {cargando ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2
                size={24}
                className="animate-spin"
              />
            </div>
          ) : visibles.length > 0 ? (
            <div className="space-y-3">

              {visibles.map((registro) => (
                <div
                  key={registro.id}
                  className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm"
                >

                  <div className="flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                      <NotebookPen size={20} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <p className="text-xs font-semibold uppercase text-cyan-700">
                            {registro.tipo ||
                              "Registro"}
                          </p>

                          <h2 className="mt-1 font-semibold">
                            {registro.titulo ||
                              "Sin título"}
                          </h2>

                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock3 size={13} />
                          {fecha(
                            registro.created_at
                          )}
                        </div>

                      </div>

                      {registro.contenido && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {registro.contenido}
                        </p>
                      )}

                      {registro.dependencia && (
                        <a
                          href={`/dependencias/${registro.dependencia.nombre
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, "")}`}
                          className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-cyan-700"
                        >
                          <Building2 size={14} />
                          {
                            registro.dependencia
                              .nombre
                          }
                        </a>
                      )}

                    </div>

                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-400 bg-white p-10 text-center">
              <FileText
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 text-sm text-slate-500">
                No se encontraron registros.
              </p>
            </div>
          )}

        </section>

      </div>

    </AppShell>
  );
}
