"use client";

import {
  Inbox,
  Mic,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Upload,
  Building2,
  Clock3,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Ingreso = {
  id: string;
  tipo_fuente: string;
  titulo: string | null;
  contenido_original: string | null;
  resumen: string | null;
  estado: string;
  created_at: string;

  dependencia: {
    nombre: string;
  } | null;
};

function iconoTipo(tipo: string) {
  if (tipo === "audio") return Mic;
  if (tipo === "foto") return ImageIcon;
  if (tipo === "archivo") return Upload;
  if (tipo === "chat") return MessageSquare;

  return FileText;
}

function fecha(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BandejaPage() {
  const supabase = createClient();

  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [filtro, setFiltro] = useState("Todos");
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
        .from("ingresos")
        .select(`
          id,
          tipo_fuente,
          titulo,
          contenido_original,
          resumen,
          estado,
          created_at,
          dependencia:dependencias(nombre)
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!error) {
        setIngresos((data || []) as Ingreso[]);
      }

      setCargando(false);
    }

    cargar();
  }, []);

  const visibles = useMemo(() => {
    if (filtro === "Todos") {
      return ingresos;
    }

    return ingresos.filter(
      (item) => item.estado === filtro
    );
  }, [ingresos, filtro]);

  return (
    <AppShell activo="Bandeja">

      <header className="border-b border-slate-300 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold">
            Bandeja de ingresos
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {ingresos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Procesados
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {
                ingresos.filter(
                  (x) => x.estado === "procesado"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Requieren revisión
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {
                ingresos.filter(
                  (x) =>
                    x.estado ===
                    "requiere_revision"
                ).length
              }
            </p>
          </div>

        </section>

        <div className="mt-5 flex gap-2 overflow-x-auto">

          {[
            "Todos",
            "procesado",
            "pendiente",
            "requiere_revision",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setFiltro(item)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
                filtro === item
                  ? "border-[#0f2b46] bg-[#0f2b46] text-white"
                  : "border-slate-400 bg-white"
              }`}
            >
              {item === "Todos"
                ? "Todos"
                : item === "procesado"
                ? "Procesados"
                : item === "pendiente"
                ? "Pendientes"
                : "Requieren revisión"}
            </button>
          ))}

        </div>

        <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">
            <Inbox className="text-cyan-700" />

            <div>
              <h2 className="font-semibold">
                Información recibida
              </h2>

              <p className="text-sm text-slate-500">
                Audios, fotos, archivos, textos y mensajes
              </p>
            </div>
          </div>

          {cargando ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2
                className="animate-spin"
                size={24}
              />
            </div>
          ) : visibles.length > 0 ? (
            <div className="mt-5 space-y-3">

              {visibles.map((item) => {
                const Icon = iconoTipo(
                  item.tipo_fuente
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-300 bg-slate-50 p-4"
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700">
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                          <div>
                            <p className="text-xs font-semibold uppercase text-cyan-700">
                              {item.tipo_fuente}
                            </p>

                            <h3 className="mt-1 font-semibold">
                              {item.titulo ||
                                "Ingreso sin título"}
                            </h3>
                          </div>

                          <Estado
                            estado={item.estado}
                          />

                        </div>

                        {item.resumen && (
                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {item.resumen}
                          </p>
                        )}

                        {!item.resumen &&
                          item.contenido_original && (
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                              {
                                item.contenido_original
                              }
                            </p>
                          )}

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">

                          <span className="flex items-center gap-1">
                            <Clock3 size={13} />
                            {fecha(item.created_at)}
                          </span>

                          {item.dependencia?.nombre && (
                            <span className="flex items-center gap-1">
                              <Building2
                                size={13}
                              />
                              {
                                item.dependencia
                                  .nombre
                              }
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          ) : (
            <div className="mt-5 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <p className="text-sm text-slate-400">
                Todavía no hay ingresos.
              </p>
            </div>
          )}

        </section>

      </div>

    </AppShell>
  );
}

function Estado({
  estado,
}: {
  estado: string;
}) {
  if (estado === "procesado") {
    return (
      <span className="flex w-fit items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        <CheckCircle2 size={13} />
        Procesado
      </span>
    );
  }

  if (estado === "requiere_revision") {
    return (
      <span className="flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        <AlertCircle size={13} />
        Revisar
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
      Pendiente
    </span>
  );
}
