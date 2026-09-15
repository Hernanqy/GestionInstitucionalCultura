"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Loader2,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  fecha_hasta: string | null;
  fecha_texto: string | null;
  lugar: string | null;
  localidad: string | null;
  costo: number | null;
  estado: string | null;
};

type Item = {
  evento_id: string;
  completado: boolean;
};

const estilos = [
  "border-violet-200 bg-violet-50",
  "border-emerald-200 bg-emerald-50",
  "border-sky-200 bg-sky-50",
  "border-orange-200 bg-orange-50",
  "border-pink-200 bg-pink-50",
  "border-amber-200 bg-amber-50",
];

function fechaCorta(fecha: string | null, fechaTexto: string | null) {
  if (fechaTexto) return fechaTexto;
  if (!fecha) return "Sin fecha";
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dinero(valor: number | null) {
  if (valor === null) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function EventosHub({
  desdeDependencia = false,
}: {
  desdeDependencia?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "proximos" | "preparacion" | "realizados">("todos");

  useEffect(() => {
    async function cargar() {
      setCargando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: eventosData, error } = await supabase
        .from("eventos")
        .select("id,nombre,fecha,fecha_hasta,fecha_texto,lugar,localidad,costo,estado")
        .eq("es_evento_gestion", true)
        .order("fecha", { ascending: true, nullsFirst: false });

      if (error) {
        console.error(error);
        setEventos([]);
        setItems([]);
        setCargando(false);
        return;
      }

      const lista = (eventosData || []) as Evento[];
      setEventos(lista);

      if (lista.length > 0) {
        const ids = lista.map((e) => e.id);
        const { data: itemsData } = await supabase
          .from("evento_items")
          .select("evento_id,completado")
          .in("evento_id", ids);
        setItems((itemsData || []) as Item[]);
      } else {
        setItems([]);
      }

      setCargando(false);
    }

    cargar();
  }, [supabase]);

  const progreso = useMemo(() => {
    const mapa = new Map<string, { total: number; hechos: number }>();
    for (const item of items) {
      const actual = mapa.get(item.evento_id) || { total: 0, hechos: 0 };
      actual.total += 1;
      if (item.completado) actual.hechos += 1;
      mapa.set(item.evento_id, actual);
    }
    return mapa;
  }, [items]);

  const hoy = new Date().toISOString().slice(0, 10);

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();

    return eventos.filter((evento) => {
      const coincide =
        !q ||
        [evento.nombre, evento.lugar, evento.localidad, evento.estado]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      if (!coincide) return false;

      if (filtro === "realizados") {
        return ["realizado", "finalizado", "completado"].includes(
          (evento.estado || "").toLowerCase()
        );
      }

      if (filtro === "preparacion") {
        return !["realizado", "finalizado", "completado", "cancelado"].includes(
          (evento.estado || "").toLowerCase()
        );
      }

      if (filtro === "proximos") {
        return Boolean(evento.fecha && evento.fecha >= hoy);
      }

      return true;
    });
  }, [eventos, buscar, filtro, hoy]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={22} className="animate-spin" />
          Cargando eventos...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-28 text-[#102b43] lg:pb-12">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href={desdeDependencia ? "/dependencias" : "/"}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#102b43]"
            >
              <ArrowLeft size={17} />
              {desdeDependencia ? "Dependencias" : "Inicio"}
            </Link>

            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#124775] text-white shadow-sm">
                <CalendarDays size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                  Eventos
                </h1>
                <p className="text-sm text-slate-500">
                  {eventos.length} eventos en seguimiento
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/eventos/nuevo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#124775] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0e3b63]"
          >
            <Plus size={18} />
            Nuevo evento
          </Link>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:w-[360px]">
              <Search size={17} className="text-slate-400" />
              <input
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar evento, lugar o localidad..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["todos", "Todos"],
                ["proximos", "Próximos"],
                ["preparacion", "En preparación"],
                ["realizados", "Realizados"],
              ].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor as typeof filtro)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    filtro === valor
                      ? "bg-[#102b43] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((evento, indice) => {
            const dato = progreso.get(evento.id) || { total: 0, hechos: 0 };
            const porcentaje =
              dato.total > 0 ? Math.round((dato.hechos / dato.total) * 100) : 0;

            return (
              <Link
                key={evento.id}
                href={`/eventos/${evento.id}`}
                className={`group rounded-[18px] border p-4 shadow-[0_4px_14px_rgba(15,43,70,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,43,70,0.10)] ${
                  estilos[indice % estilos.length]
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-base font-extrabold leading-tight text-[#102b43]">
                      {evento.nombre}
                    </h2>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <CalendarDays size={14} />
                      {fechaCorta(evento.fecha, evento.fecha_texto)}
                    </p>
                    {(evento.lugar || evento.localidad) && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin size={14} />
                        {[evento.lugar, evento.localidad].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-extrabold uppercase text-slate-600">
                    {evento.estado || "pendiente"}
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-white/75 p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <ClipboardCheck size={14} />
                      Seguimiento
                    </span>
                    <span>
                      {dato.hechos}/{dato.total}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#1685a7]"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  {evento.costo !== null ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <CircleDollarSign size={14} />
                      {dinero(evento.costo)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin costo total cargado</span>
                  )}

                  {porcentaje === 100 && dato.total > 0 && (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  )}
                </div>
              </Link>
            );
          })}
        </section>

        {visibles.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No hay eventos para este filtro.
          </div>
        )}
      </div>
    </main>
  );
}