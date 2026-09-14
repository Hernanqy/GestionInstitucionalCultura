"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  ClipboardList,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type ItemProximo = {
  id: string;
  tipo: "evento" | "pendiente";
  titulo: string;
  fecha: string;
  hora: string | null;
  detalle: string | null;
  prioridad?: string | null;
};

function convertirFechaLocal(fecha: string, hora?: string | null) {
  const horaFinal = hora ? hora.slice(0, 8) : "23:59:59";

  return new Date(`${fecha}T${horaFinal}`);
}

function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(anio, mes - 1, dia));
}

function formatearHora(hora: string | null) {
  if (!hora) return null;

  return hora.slice(0, 5);
}

export default function ProximosEventos() {
  const supabase = createClient();

  const [items, setItems] = useState<ItemProximo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);

      const ahora = new Date();

      const hoy =
        ahora.getFullYear() +
        "-" +
        String(ahora.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(ahora.getDate()).padStart(2, "0");

      const [eventosRespuesta, pendientesRespuesta] = await Promise.all([
        supabase
          .from("eventos")
          .select(`
            id,
            nombre,
            fecha,
            hora,
            lugar,
            estado
          `)
          .not("fecha", "is", null)
          .gte("fecha", hoy),

        supabase
          .from("pendientes")
          .select(`
            id,
            titulo,
            fecha_limite,
            prioridad,
            completado
          `)
          .not("fecha_limite", "is", null)
          .eq("completado", false)
          .gte("fecha_limite", hoy),
      ]);

      if (eventosRespuesta.error) {
        console.error(
          "Error cargando eventos:",
          eventosRespuesta.error
        );
      }

      if (pendientesRespuesta.error) {
        console.error(
          "Error cargando pendientes:",
          pendientesRespuesta.error
        );
      }

      const eventos: ItemProximo[] =
        (eventosRespuesta.data || [])
          .filter((evento) => {
            if (!evento.fecha) return false;

            const fechaEvento = convertirFechaLocal(
              evento.fecha,
              evento.hora
            );

            return fechaEvento >= ahora;
          })
          .map((evento) => ({
            id: evento.id,
            tipo: "evento",
            titulo: evento.nombre,
            fecha: evento.fecha,
            hora: evento.hora,
            detalle: evento.lugar || null,
          }));

      const pendientes: ItemProximo[] =
        (pendientesRespuesta.data || [])
          .filter((pendiente) => {
            if (!pendiente.fecha_limite) return false;

            const fechaPendiente = convertirFechaLocal(
              pendiente.fecha_limite,
              null
            );

            return fechaPendiente >= ahora;
          })
          .map((pendiente) => ({
            id: pendiente.id,
            tipo: "pendiente",
            titulo: pendiente.titulo,
            fecha: pendiente.fecha_limite,
            hora: null,
            detalle: null,
            prioridad: pendiente.prioridad,
          }));

      const unidos = [...eventos, ...pendientes];

      unidos.sort((a, b) => {
        const fechaA = convertirFechaLocal(
          a.fecha,
          a.hora || null
        ).getTime();

        const fechaB = convertirFechaLocal(
          b.fecha,
          b.hora || null
        ).getTime();

        return fechaA - fechaB;
      });

      setItems(unidos);
      setCargando(false);
    }

    cargar();

    const intervalo = setInterval(() => {
      cargar();
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  const proximos = useMemo(() => {
    return items.slice(0, 5);
  }, [items]);

  return (
    <section className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Próximos eventos
            </h2>

            <p className="text-xs text-slate-500">
              Reuniones, actividades y compromisos con fecha
            </p>
          </div>

        </div>

        <a
          href="/agenda"
          className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
        >
          Ver agenda
        </a>

      </div>

      {cargando ? (
        <div className="flex min-h-32 items-center justify-center">

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Cargando...
          </div>

        </div>
      ) : proximos.length === 0 ? (
        <div className="mt-5 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">

          <p className="text-sm text-slate-500">
            No hay próximos eventos.
          </p>

        </div>
      ) : (
        <div className="mt-5 space-y-3">

          {proximos.map((item) => (

            <div
              key={`${item.tipo}-${item.id}`}
              className="flex items-center gap-4 rounded-xl border border-slate-300 bg-slate-50 p-4"
            >

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  item.tipo === "evento"
                    ? "bg-cyan-100 text-cyan-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.tipo === "evento" ? (
                  <CalendarDays size={19} />
                ) : (
                  <ClipboardList size={19} />
                )}
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h3 className="font-medium text-slate-900">
                    {item.titulo}
                  </h3>

                  {item.tipo === "pendiente" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      Fecha límite
                    </span>
                  )}

                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">

                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {formatearFecha(item.fecha)}
                  </span>

                  {item.hora && (
                    <span className="flex items-center gap-1.5">
                      <Clock3 size={14} />
                      {formatearHora(item.hora)}
                    </span>
                  )}

                  {item.detalle && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {item.detalle}
                    </span>
                  )}

                </div>

              </div>

              <ChevronRight
                size={18}
                className="shrink-0 text-slate-400"
              />

            </div>

          ))}

        </div>
      )}

    </section>
  );
}
