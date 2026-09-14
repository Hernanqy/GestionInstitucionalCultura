"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  ClipboardList,
  Loader2,
  MapPin,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type ItemProximo = {
  id: string;
  tipo: "evento" | "pendiente";
  titulo: string;
  detalle: string | null;
  fecha: string;
  hora: string | null;
  estado: string | null;
  vence_en: string;
};

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

  async function cargar() {
    const { data, error } = await supabase
      .from("proximos_unificado")
      .select(`
        id,
        tipo,
        titulo,
        detalle,
        fecha,
        hora,
        estado,
        vence_en
      `)
      .order("vence_en", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error cargando próximos:",
        error
      );

      setCargando(false);
      return;
    }

    setItems(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();

    const intervalo = setInterval(() => {
      cargar();
    }, 30000);

    const actualizar = () => {
      cargar();
    };

    window.addEventListener(
      "gestion:actualizada",
      actualizar
    );

    return () => {
      clearInterval(intervalo);

      window.removeEventListener(
        "gestion:actualizada",
        actualizar
      );
    };
  }, []);

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
              Todo lo que tenga una fecha futura
            </p>
          </div>

        </div>

        <a
          href="/agenda"
          className="text-sm font-medium text-cyan-700"
        >
          Ver agenda
        </a>

      </div>

      {cargando ? (
        <div className="flex min-h-28 items-center justify-center">

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2
              size={18}
              className="animate-spin"
            />

            Cargando...
          </div>

        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">

          <p className="text-sm text-slate-500">
            No hay próximos eventos.
          </p>

        </div>
      ) : (
        <div className="mt-5 space-y-3">

          {items.slice(0, 6).map((item) => (

            <div
              key={item.id}
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

            </div>

          ))}

        </div>
      )}

    </section>
  );
}

