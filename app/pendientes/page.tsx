"use client";

import {
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

function fecha(
  valor: string | null
) {
  if (!valor) return null;

  const [a, m, d] =
    valor.split("-");

  return `${d}/${m}/${a}`;
}

export default function PendientesPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [pendientes, setPendientes] =
    useState<Pendiente[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState<string | null>(null);

  useEffect(() => {
    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciar() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href =
        "/login";
      return;
    }

    await cargar();
  }

  async function cargar() {
    setCargando(true);

    const { data, error } =
      await supabase
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
        .eq("completado", false)
        .order("fecha_limite", {
          ascending: true,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(error);
    } else {
      setPendientes(
        (data || []) as unknown as Pendiente[]
      );
    }

    setCargando(false);
  }

  async function completar(
    item: Pendiente
  ) {
    setProcesando(item.id);

    const anterior = pendientes;

    setPendientes((actuales) =>
      actuales.filter(
        (pendiente) =>
          pendiente.id !== item.id
      )
    );

    const { error } =
      await supabase
        .from("pendientes")
        .update({
          completado: true,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", item.id);

    if (error) {
      console.error(error);

      setPendientes(anterior);

      alert(
        "No se pudo completar el pendiente."
      );
    }

    setProcesando(null);
  }

  const prioritarios =
    useMemo(() => {
      return pendientes.filter(
        (item) => {
          const valor =
            item.prioridad
              ?.toLowerCase()
              .trim();

          return (
            valor === "alta" ||
            valor === "urgente"
          );
        }
      );
    }, [pendientes]);

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-slate-900 lg:pb-10">

      <div className="mx-auto max-w-[1300px] px-5 py-7 md:px-8">

        {/* CABECERA */}

        <section className="flex items-center gap-4">

          <div
            className="
              flex h-16 w-16
              items-center justify-center
              rounded-[20px]
              border border-emerald-200
              bg-gradient-to-br
              from-emerald-50
              to-teal-100
              text-[38px]
              shadow-sm
            "
          >
            📋
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Pendientes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Tareas e información que requieren seguimiento
            </p>
          </div>

        </section>

        {/* RESUMEN */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2">

          <div
            className="
              rounded-[20px]
              border border-slate-300
              bg-white
              p-5
              shadow-[0_5px_14px_rgba(15,23,42,0.04)]
            "
          >
            <p className="text-sm text-slate-500">
              Pendientes activos
            </p>

            <p className="mt-1 text-3xl font-bold">
              {pendientes.length}
            </p>
          </div>

          <div
            className="
              rounded-[20px]
              border border-slate-300
              bg-white
              p-5
              shadow-[0_5px_14px_rgba(15,23,42,0.04)]
            "
          >
            <p className="text-sm text-slate-500">
              Prioritarios
            </p>

            <p className="mt-1 text-3xl font-bold">
              {prioritarios.length}
            </p>
          </div>

        </section>

        {/* LISTA */}

        <section
          className="
            mt-5
            rounded-[22px]
            border border-slate-300
            bg-white
            p-6
            shadow-[0_6px_18px_rgba(15,23,42,0.05)]
          "
        >

          <div className="flex items-center gap-3">

            <ClipboardList
              className="text-cyan-700"
              size={22}
            />

            <div>
              <h2 className="font-bold">
                Mi lista
              </h2>

              <p className="text-xs text-slate-500">
                Marcá el círculo cuando esté resuelto
              </p>
            </div>

          </div>

          {cargando ? (
            <div className="flex min-h-60 items-center justify-center">

              <Loader2
                className="animate-spin"
                size={25}
              />

            </div>
          ) : pendientes.length ===
            0 ? (
            <div
              className="
                mt-6
                rounded-2xl
                border border-dashed
                border-slate-300
                bg-slate-50
                p-12
                text-center
              "
            >
              <div className="text-4xl">
                ✅
              </div>

              <h3 className="mt-3 font-bold">
                Todo al día
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                No hay pendientes activos.
              </p>

            </div>
          ) : (
            <div className="mt-6 space-y-3">

              {pendientes.map(
                (item) => (
                  <div
                    key={item.id}
                    className="
                      rounded-2xl
                      border border-slate-300
                      bg-slate-50
                      p-5
                      transition
                      hover:bg-white
                      hover:shadow-md
                    "
                  >

                    <div className="flex gap-4">

                      <button
                        onClick={() =>
                          completar(
                            item
                          )
                        }
                        disabled={
                          procesando ===
                          item.id
                        }
                        className="
                          mt-0.5
                          flex h-10 w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border-2
                          border-slate-300
                          bg-white
                          text-transparent
                          transition-all
                          hover:scale-105
                          hover:border-emerald-500
                          hover:bg-emerald-50
                          hover:text-emerald-600
                          disabled:opacity-40
                        "
                        title="Completar pendiente"
                      >
                        {procesando ===
                        item.id ? (
                          <Loader2
                            size={18}
                            className="animate-spin text-slate-500"
                          />
                        ) : (
                          <Check
                            size={19}
                          />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">

                          <div>
                            <h3 className="text-[16px] font-bold">
                              {
                                item.titulo
                              }
                            </h3>

                            {item.descripcion && (
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {
                                  item.descripcion
                                }
                              </p>
                            )}
                          </div>

                          <span
                            className={`
                              w-fit
                              rounded-full
                              px-3 py-1
                              text-[10px]
                              font-bold
                              uppercase
                              ${
                                item.prioridad?.toLowerCase() ===
                                  "alta" ||
                                item.prioridad?.toLowerCase() ===
                                  "urgente"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                              }
                            `}
                          >
                            {item.prioridad ||
                              "normal"}
                          </span>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">

                          {item.dependencia
                            ?.nombre && (
                            <span className="flex items-center gap-1.5">

                              <Building2
                                size={14}
                              />

                              {
                                item
                                  .dependencia
                                  .nombre
                              }

                            </span>
                          )}

                          {item.fecha_limite && (
                            <span className="flex items-center gap-1.5">

                              <CalendarDays
                                size={14}
                              />

                              Límite:{" "}
                              {fecha(
                                item.fecha_limite
                              )}

                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}
