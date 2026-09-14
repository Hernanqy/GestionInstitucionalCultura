"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Home,
  Loader2,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  slug: string | null;
};

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
};

const estilos = [
  "from-violet-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

function crearSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fechaLocal() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export default function InicioPage() {
  const supabase = useMemo(() => createClient(), []);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [todo, setTodo] = useState(0);
  const [proximoEvento, setProximoEvento] = useState<Evento | null>(null);

  useEffect(() => {
    async function cargarInicio() {
      setCargando(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const hoy = fechaLocal();
      const [dependenciasResult, pendientesResult, todoResult, proximoResult] =
        await Promise.all([
          supabase
            .from("dependencias")
            .select("id,nombre,area,slug")
            .eq("activa", true)
            .order("nombre", { ascending: true })
            .range(0, 999),
          supabase
            .from("pendientes")
            .select("*", { count: "exact", head: true })
            .eq("completado", false),
          supabase
            .from("todo_unificado")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("eventos")
            .select("id,nombre,fecha,hora,lugar")
            .gte("fecha", hoy)
            .order("fecha", { ascending: true })
            .order("hora", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

      if (dependenciasResult.error) {
        console.error(dependenciasResult.error);
        setError("No se pudieron cargar las dependencias.");
      }

      setDependencias((dependenciasResult.data || []) as Dependencia[]);
      setPendientes(pendientesResult.count || 0);
      setTodo(todoResult.count || 0);
      setProximoEvento((proximoResult.data as Evento | null) || null);
      setCargando(false);
    }

    cargarInicio();
  }, [supabase]);

  const dependenciasFiltradas = useMemo(() => {
    const texto = buscar.trim().toLocaleLowerCase("es");
    if (!texto) return dependencias;

    return dependencias.filter((dependencia) =>
      [dependencia.nombre, dependencia.area]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(texto)
    );
  }, [buscar, dependencias]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f2f6f8]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={23} />
          Cargando gestiÃ³n...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f6f8] pb-24 text-slate-900 lg:pb-8">
      <header className="bg-[#0f2b46] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-6 md:px-8 md:pb-24 md:pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                <Building2 size={25} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">GI</p>
                <p className="text-xs text-slate-300">Cultura Â· OlavarrÃ­a</p>
              </div>
            </div>

            <Link
              href="/configuracion"
              aria-label="ConfiguraciÃ³n"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            >
              <Settings size={20} />
            </Link>
          </div>

          <div className="mt-9">
            <p className="text-sm font-medium text-cyan-300">GestiÃ³n Institucional</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Hola, HernÃ¡n</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
              Todo lo importante de Cultura, ordenado en un solo lugar.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-14 max-w-7xl px-4 md:-mt-16 md:px-8">
        <Link
          href="/todo"
          className="group block overflow-hidden rounded-[26px] bg-gradient-to-br from-[#183f61] to-[#0f2b46] p-6 text-white shadow-[0_18px_45px_rgba(15,43,70,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(15,43,70,0.30)] md:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-[#0f2b46] shadow-lg shadow-cyan-950/20">
                <CheckCircle2 size={29} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Vista general</p>
                <h2 className="mt-1 text-2xl font-bold">TODO</h2>
                <p className="mt-1 text-sm text-slate-300">Tareas y seguimientos de todas las dependencias</p>
              </div>
            </div>
            <ArrowRight className="mt-2 shrink-0 transition group-hover:translate-x-1" size={23} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-2xl font-bold">{todo}</p>
              <p className="text-xs text-slate-300">Elementos totales</p>
            </div>
            <div className="rounded-2xl bg-orange-400/15 px-4 py-3 ring-1 ring-orange-300/20">
              <p className="text-2xl font-bold text-orange-300">{pendientes}</p>
              <p className="text-xs text-slate-300">Pendientes activos</p>
            </div>
          </div>
        </Link>

        {proximoEvento && (
          <Link
            href={`/agenda/${proximoEvento.id}`}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-sky-300"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <CalendarDays size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">PrÃ³ximo en agenda</p>
              <p className="truncate font-semibold">{proximoEvento.nombre}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 size={13} />
                {proximoEvento.fecha || "Sin fecha"}
                {proximoEvento.hora ? ` Â· ${proximoEvento.hora.slice(0, 5)}` : ""}
              </p>
            </div>
            <ChevronRight className="shrink-0 text-slate-400" size={20} />
          </Link>
        )}

        <section className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Acceso por espacio</p>
              <h2 className="mt-1 text-2xl font-bold">Dependencias</h2>
              <p className="mt-1 text-sm text-slate-500">
                {dependencias.length} dependencias activas cargadas en el sistema
              </p>
            </div>

            <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:max-w-sm">
              <Search className="shrink-0 text-slate-400" size={19} />
              <input
                value={buscar}
                onChange={(evento) => setBuscar(evento.target.value)}
                placeholder="Buscar dependencia..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <CircleAlert size={18} />
              {error}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dependenciasFiltradas.map((dependencia, indice) => {
              const slug = dependencia.slug || crearSlug(dependencia.nombre);
              const estilo = estilos[indice % estilos.length];

              return (
                <Link
                  key={dependencia.id}
                  href={`/dependencias/${slug}`}
                  className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,43,70,0.06)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,43,70,0.12)]"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${estilo}`} />
                  <div className="flex items-start gap-4">
                    <div className={`flex h-[52px] w-[52px] min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br ${estilo} text-white shadow-md`}>
                      <Building2 size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold leading-snug text-slate-900">{dependencia.nombre}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {dependencia.area || "GestiÃ³n de la dependencia"}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600" size={20} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {["Personal", "Pendientes", "Agenda", "Proyectos"].map((modulo) => (
                      <span key={modulo} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {modulo}
                      </span>
                    ))}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">+5</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {!error && dependenciasFiltradas.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No se encontraron dependencias con ese nombre.
            </div>
          )}
        </section>
      </div>

      <Link
        href="/registrar"
        aria-label="Registrar nueva informaciÃ³n"
        className="fixed bottom-[88px] right-5 z-30 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#0f2b46] text-white shadow-[0_12px_28px_rgba(15,43,70,0.35)] transition hover:scale-105 lg:bottom-8 lg:right-8"
      >
        <Plus size={27} />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          <Link href="/" className="flex flex-col items-center gap-1 py-3 text-xs font-semibold text-sky-700">
            <Home size={20} />
            Inicio
          </Link>
          <Link href="/todo" className="flex flex-col items-center gap-1 py-3 text-xs text-slate-500">
            <CheckCircle2 size={20} />
            TODO
          </Link>
          <Link href="/agenda" className="flex flex-col items-center gap-1 py-3 text-xs text-slate-500">
            <CalendarDays size={20} />
            Agenda
          </Link>
          <Link href="/personal" className="flex flex-col items-center gap-1 py-3 text-xs text-slate-500">
            <Users size={20} />
            Personal
          </Link>
        </div>
      </nav>
    </main>
  );
}
