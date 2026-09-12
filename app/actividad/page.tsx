"use client";

import {
  Activity,
  UserRound,
  Building2,
  NotebookPen,
  ClipboardList,
  CalendarDays,
  Inbox,
  Clock3,
  Loader2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type ActividadItem = {
  id: string;
  tipo: string;
  titulo: string;
  detalle: string | null;
  fecha: string;
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

function icono(tipo: string) {
  if (tipo === "personal") return UserRound;
  if (tipo === "dependencia") return Building2;
  if (tipo === "registro") return NotebookPen;
  if (tipo === "pendiente") return ClipboardList;
  if (tipo === "evento") return CalendarDays;
  if (tipo === "ingreso") return Inbox;

  return Activity;
}

export default function ActividadPage() {
  const supabase = createClient();

  const [actividad, setActividad] = useState<ActividadItem[]>([]);
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

      const [
        historialRes,
        registrosRes,
        pendientesRes,
        eventosRes,
        ingresosRes,
      ] = await Promise.all([
        supabase
          .from("historial_cambios")
          .select(`
            id,
            entidad,
            entidad_id,
            campo,
            valor_anterior,
            valor_nuevo,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(50),

        supabase
          .from("registros")
          .select(`
            id,
            titulo,
            contenido,
            tipo,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(30),

        supabase
          .from("pendientes")
          .select(`
            id,
            titulo,
            descripcion,
            completado,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(30),

        supabase
          .from("eventos")
          .select(`
            id,
            nombre,
            lugar,
            fecha,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(30),

        supabase
          .from("ingresos")
          .select(`
            id,
            titulo,
            resumen,
            tipo_fuente,
            estado,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(30),
      ]);

      const lista: ActividadItem[] = [];

      for (const item of historialRes.data || []) {
        lista.push({
          id: `hist-${item.id}`,
          tipo:
            item.entidad === "personas"
              ? "personal"
              : "dependencia",
          titulo:
            item.entidad === "personas"
              ? "Cambio en personal"
              : "Cambio en dependencia",
          detalle:
            `${item.campo}: ${item.valor_anterior || "Sin dato"} → ${item.valor_nuevo || "Sin dato"}`,
          fecha: item.created_at,
        });
      }

      for (const item of registrosRes.data || []) {
        lista.push({
          id: `reg-${item.id}`,
          tipo: "registro",
          titulo:
            item.titulo ||
            item.tipo ||
            "Nuevo registro",
          detalle:
            item.contenido?.slice(0, 140) || null,
          fecha: item.created_at,
        });
      }

      for (const item of pendientesRes.data || []) {
        lista.push({
          id: `pen-${item.id}`,
          tipo: "pendiente",
          titulo: item.titulo,
          detalle:
            item.descripcion ||
            (item.completado
              ? "Pendiente completado"
              : "Pendiente activo"),
          fecha: item.created_at,
        });
      }

      for (const item of eventosRes.data || []) {
        lista.push({
          id: `eve-${item.id}`,
          tipo: "evento",
          titulo: item.nombre,
          detalle:
            item.lugar ||
            (item.fecha
              ? `Fecha: ${item.fecha}`
              : "Evento sin fecha"),
          fecha: item.created_at,
        });
      }

      for (const item of ingresosRes.data || []) {
        lista.push({
          id: `ing-${item.id}`,
          tipo: "ingreso",
          titulo:
            item.titulo ||
            `Ingreso ${item.tipo_fuente}`,
          detalle:
            item.resumen ||
            `Estado: ${item.estado}`,
          fecha: item.created_at,
        });
      }

      lista.sort(
        (a, b) =>
          new Date(b.fecha).getTime() -
          new Date(a.fecha).getTime()
      );

      setActividad(lista.slice(0, 100));
      setCargando(false);
    }

    cargar();
  }, []);

  const visibles = useMemo(() => {
    if (filtro === "Todos") {
      return actividad;
    }

    return actividad.filter(
      (item) => item.tipo === filtro
    );
  }, [actividad, filtro]);

  const filtros = [
    ["Todos", "Todos"],
    ["personal", "Personal"],
    ["dependencia", "Dependencias"],
    ["registro", "Registros"],
    ["pendiente", "Pendientes"],
    ["evento", "Eventos"],
    ["ingreso", "Ingresos"],
  ];

  return (
    <AppShell activo="Actividad">

      <header className="border-b border-slate-400 bg-white">

        <div className="px-5 py-4 md:px-8">

          <h1 className="text-xl font-semibold">
            Actividad reciente
          </h1>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <section className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <Activity className="text-sky-700" />

            <div>

              <h2 className="font-semibold">
                Movimiento general
              </h2>

              <p className="text-sm text-slate-950">
                Últimos cambios y nuevas incorporaciones
              </p>

            </div>

          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto">

            {filtros.map(([valor, texto]) => (
              <button
                key={valor}
                onClick={() => setFiltro(valor)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
                  filtro === valor
                    ? "border-[#0f2b46] bg-slate-900 text-white"
                    : "border-slate-400 bg-white text-slate-950"
                }`}
              >
                {texto}
              </button>
            ))}

          </div>

        </section>

        {cargando ? (
          <div className="flex min-h-60 items-center justify-center">

            <Loader2
              size={24}
              className="animate-spin"
            />

          </div>
        ) : (
          <section className="mt-5 space-y-3">

            {visibles.map((item) => {
              const Icon = icono(item.tipo);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm"
                >

                  <div className="flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">

                      <Icon size={20} />

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <p className="text-xs font-semibold uppercase text-sky-700">
                            {item.tipo}
                          </p>

                          <h3 className="mt-1 font-semibold">
                            {item.titulo}
                          </h3>

                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-950">

                          <Clock3 size={13} />

                          {fecha(item.fecha)}

                        </div>

                      </div>

                      {item.detalle && (
                        <p className="mt-3 text-sm leading-6 text-slate-950">
                          {item.detalle}
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              );
            })}

            {visibles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-400 bg-white p-10 text-center text-sm text-slate-950">
                No hay actividad para mostrar.
              </div>
            )}

          </section>
        )}

      </div>

    </AppShell>
  );
}


