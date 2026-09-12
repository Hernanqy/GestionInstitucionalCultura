"use client";

import {
  ClipboardList,
  Check,
  Circle,
  Building2,
  Loader2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Pendiente = {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: string | null;
  fecha_limite: string | null;
  completado: boolean;

  dependencia: {
    nombre: string;
  } | null;
};

function fecha(valor: string | null) {
  if (!valor) return null;

  const [a, m, d] = valor.split("-");

  return `${d}/${m}/${a}`;
}

export default function PendientesPage() {
  const supabase = createClient();

  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    const { data, error } = await supabase
      .from("pendientes")
      .select(`
        id,
        titulo,
        descripcion,
        prioridad,
        fecha_limite,
        completado,
        dependencia:dependencias(nombre)
      `)
      .order("completado", { ascending: true })
      .order("fecha_limite", {
        ascending: true,
        nullsFirst: false,
      });

    if (!error) {
      setPendientes((data || []) as unknown as Pendiente[]);
    }

    setCargando(false);
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      await cargar();
    }

    iniciar();
  }, []);

  const activos = useMemo(
    () => pendientes.filter((p) => !p.completado),
    [pendientes]
  );

  async function cambiar(item: Pendiente) {
    await supabase
      .from("pendientes")
      .update({
        completado: !item.completado,
      })
      .eq("id", item.id);

    await cargar();
  }

  return (
    <AppShell activo="Pendientes">

      <header className="border-b border-slate-400 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold">
            Pendientes
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <section className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-black">
              Pendientes activos
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {activos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-black">
              Total histórico
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {pendientes.length}
            </p>
          </div>

        </section>

        <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">
            <ClipboardList className="text-sky-700" />

            <h2 className="font-semibold">
              Todos los pendientes
            </h2>
          </div>

          {cargando ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2
                className="animate-spin"
                size={24}
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">

              {pendientes.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 ${
                    item.completado
                      ? "border-slate-400 bg-slate-100"
                      : "border-slate-400 bg-slate-100"
                  }`}
                >

                  <div className="flex gap-3">

                    <button
                      onClick={() => cambiar(item)}
                      className="mt-1"
                    >
                      {item.completado ? (
                        <Check
                          size={20}
                          className="text-green-600"
                        />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>

                    <div className="flex-1">

                      <h3
                        className={`font-semibold ${
                          item.completado
                            ? "text-black line-through"
                            : ""
                        }`}
                      >
                        {item.titulo}
                      </h3>

                      {item.descripcion && (
                        <p className="mt-2 text-sm text-black">
                          {item.descripcion}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-black">

                        {item.dependencia?.nombre && (
                          <span className="flex items-center gap-1">
                            <Building2 size={13} />
                            {item.dependencia.nombre}
                          </span>
                        )}

                        {item.fecha_limite && (
                          <span>
                            Límite: {fecha(item.fecha_limite)}
                          </span>
                        )}

                        <span>
                          Prioridad: {item.prioridad || "normal"}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>

    </AppShell>
  );
}




