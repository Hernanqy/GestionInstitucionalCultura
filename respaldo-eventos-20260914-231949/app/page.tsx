"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clock3,
  Clapperboard,
  FlaskConical,
  GraduationCap,
  Landmark,
  Leaf,
  Library,
  ListTodo,
  Loader2,
  Music2,
  Palette,
  PawPrint,
  Plus,
  Settings,
  Theater,
  Trees,
  UsersRound,
  Wheat,
  Wrench,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  slug: string | null;
};

type PendienteResumen = {
  id: string;
  fecha_limite: string | null;
};

const estilosDependencia = [
  { fondo: "bg-violet-100", borde: "border-violet-200", icono: "text-violet-800" },
  { fondo: "bg-emerald-100", borde: "border-emerald-200", icono: "text-emerald-800" },
  { fondo: "bg-sky-100", borde: "border-sky-200", icono: "text-sky-800" },
  { fondo: "bg-orange-100", borde: "border-orange-200", icono: "text-orange-800" },
  { fondo: "bg-green-100", borde: "border-green-200", icono: "text-green-800" },
  { fondo: "bg-pink-100", borde: "border-pink-200", icono: "text-pink-800" },
  { fondo: "bg-red-100", borde: "border-red-200", icono: "text-red-800" },
  { fondo: "bg-cyan-100", borde: "border-cyan-200", icono: "text-cyan-800" },
  { fondo: "bg-amber-100", borde: "border-amber-200", icono: "text-amber-800" },
  { fondo: "bg-lime-100", borde: "border-lime-200", icono: "text-lime-800" },
  { fondo: "bg-blue-100", borde: "border-blue-200", icono: "text-blue-800" },
  { fondo: "bg-fuchsia-100", borde: "border-fuchsia-200", icono: "text-fuchsia-800" },
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

function obtenerIcono(nombre: string, area: string | null) {
  const texto = `${nombre} ${area || ""}`.toLocaleLowerCase("es");

  if (texto.includes("bioparque") || texto.includes("fauna")) return PawPrint;
  if (texto.includes("reserva") || texto.includes("natural")) return Leaf;
  if (texto.includes("ciit") || texto.includes("ciencia") || texto.includes("investig")) return FlaskConical;
  if (texto.includes("museo") || texto.includes("patrimonio") || texto.includes("históric") || texto.includes("historic")) return Landmark;
  if (texto.includes("archivo")) return Library;
  if (texto.includes("biblioteca") || texto.includes("libro")) return BookOpen;
  if (texto.includes("teatro") || texto.includes("danza") || texto.includes("ballet")) return Theater;
  if (texto.includes("cine") || texto.includes("audiovisual")) return Clapperboard;
  if (texto.includes("música") || texto.includes("musica") || texto.includes("orquesta") || texto.includes("banda")) return Music2;
  if (texto.includes("arte") || texto.includes("plástica") || texto.includes("plastica")) return Palette;
  if (texto.includes("educación") || texto.includes("educacion") || texto.includes("formación") || texto.includes("formacion")) return GraduationCap;
  if (texto.includes("taller")) return Wrench;
  if (texto.includes("espiga") || texto.includes("rural")) return Wheat;
  if (texto.includes("parque") || texto.includes("máxima") || texto.includes("maxima")) return Trees;
  if (texto.includes("goco") || texto.includes("coordinación") || texto.includes("coordinacion")) return UsersRound;
  return Building2;
}

export default function InicioPage() {
  const supabase = useMemo(() => createClient(), []);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [pendientes, setPendientes] = useState<PendienteResumen[]>([]);

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

      const [dependenciasResult, pendientesResult] = await Promise.all([
        supabase
          .from("dependencias")
          .select("id,nombre,area,slug")
          .eq("activa", true)
          .order("nombre", { ascending: true })
          .range(0, 999),
        supabase
          .from("pendientes")
          .select("id,fecha_limite")
          .eq("completado", false)
          .range(0, 9999),
      ]);

      if (dependenciasResult.error) {
        console.error(dependenciasResult.error);
        setError("No se pudieron cargar las dependencias.");
      } else {
        setDependencias((dependenciasResult.data || []) as Dependencia[]);
      }

      if (pendientesResult.error) {
        console.error(pendientesResult.error);
        setError((actual) => actual || "No se pudieron cargar los pendientes.");
      } else {
        setPendientes((pendientesResult.data || []) as PendienteResumen[]);
      }

      setCargando(false);
    }

    cargarInicio();
  }, [supabase]);

  const resumenPendientes = useMemo(() => {
    const hoy = fechaLocal();
    let vencidas = 0;
    let proximas = 0;
    let sinFecha = 0;

    pendientes.forEach((item) => {
      if (!item.fecha_limite) {
        sinFecha += 1;
      } else if (item.fecha_limite < hoy) {
        vencidas += 1;
      } else {
        proximas += 1;
      }
    });

    return { vencidas, proximas, sinFecha };
  }, [pendientes]);



  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={23} />
          Cargando gestión...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-28 text-[#102b43] lg:pb-12">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-8 pt-5 sm:px-6 md:px-8 md:pt-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="text-[38px] font-black leading-none tracking-[-0.08em] text-[#123f6d] md:text-[44px]">
              GI
            </div>
            <div className="h-10 w-px shrink-0 bg-slate-300" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold leading-tight text-[#143a63] md:text-base">
                Gestión Integral
              </p>
              <p className="truncate text-xs font-medium text-slate-500 md:text-sm">
                Cultura · Olavarría
              </p>
            </div>
          </div>

          <Link
            href="/configuracion"
            aria-label="Configuración"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#143a63] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Settings size={20} />
          </Link>
        </div>

        <p className="mt-5 text-center text-sm font-medium text-slate-500 md:text-left">
          Planificar hoy, una cultura más viva mañana.
        </p>

        <Link
          href="/todo"
          className="group mt-4 flex items-center gap-4 rounded-[18px] bg-gradient-to-r from-[#0f4777] to-[#123967] px-5 py-4 text-white shadow-[0_10px_28px_rgba(15,71,119,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,71,119,0.28)] md:px-6 md:py-5"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/15">
            <ListTodo size={27} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold leading-tight text-white md:text-xl">TODO</p>
            <p className="mt-0.5 text-sm font-medium text-blue-100">
              {pendientes.length} {pendientes.length === 1 ? "pendiente" : "pendientes"}
            </p>
          </div>
          <ArrowRight className="shrink-0 transition group-hover:translate-x-1" size={23} />
        </Link>

        <div className="mt-3 grid grid-cols-3 gap-2 md:max-w-xl md:gap-3">
          <Link
            href="/todo"
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-white px-2 py-2.5 text-center text-xs font-semibold text-slate-600 shadow-sm"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">!</span>
            <span className="truncate">{resumenPendientes.vencidas} Vencidas</span>
          </Link>
          <Link
            href="/todo"
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-amber-100 bg-white px-2 py-2.5 text-center text-xs font-semibold text-slate-600 shadow-sm"
          >
            <CalendarDays size={16} className="shrink-0 text-amber-500" />
            <span className="truncate">{resumenPendientes.proximas} Próximas</span>
          </Link>
          <Link
            href="/todo"
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-center text-xs font-semibold text-slate-600 shadow-sm"
          >
            <Clock3 size={16} className="shrink-0 text-slate-500" />
            <span className="truncate">{resumenPendientes.sinFecha} Sin fecha</span>
          </Link>
        </div>

        <section className="mt-7">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-extrabold tracking-tight text-[#102b43] md:text-2xl">Dependencias</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/dependencias/gestionar"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4f82] px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#083e68]"
              >
                <Plus size={16} />
                Agregar
              </Link>

              <Link
                href="/dependencias"
                className="shrink-0 text-sm font-bold text-sky-600 transition hover:text-sky-700"
              >
                Ver todas
              </Link>
            </div>
          </div>


          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <CircleAlert size={18} />
              {error}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {dependencias.map((dependencia, indice) => {
              const slug = dependencia.slug || crearSlug(dependencia.nombre);
              const estilo = estilosDependencia[indice % estilosDependencia.length];
              const Icono = obtenerIcono(dependencia.nombre, dependencia.area);

              return (
                <Link
                  key={dependencia.id}
                  href={`/dependencias/${slug}`}
                  className={`group relative min-h-[86px] overflow-hidden rounded-[16px] border ${estilo.borde} ${estilo.fondo} p-3.5 shadow-[0_4px_12px_rgba(15,43,70,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_9px_20px_rgba(15,43,70,0.10)] md:p-4`}
                >
                  <div className="flex h-full items-center gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/70 ${estilo.icono} shadow-sm`}>
                      <Icono size={22} strokeWidth={2.1} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-[13px] font-extrabold leading-[1.18] text-[#102b43] md:text-sm">
                        {dependencia.nombre}
                      </h2>
                      {dependencia.area && dependencia.area !== dependencia.nombre && (
                        <p className="mt-1 line-clamp-1 text-[10px] font-medium leading-tight text-slate-600 md:text-[11px]">
                          {dependencia.area}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="shrink-0 text-slate-500/70 transition group-hover:translate-x-0.5" size={16} />
                  </div>
                </Link>
              );
            })}
          </div>

          {!error && dependencias.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No hay dependencias activas cargadas.
            </div>
          )}
        </section>
      </div>

      <Link
        href="/registrar"
        aria-label="Registrar nueva información"
        className="fixed bottom-[78px] right-5 z-40 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#124775] text-white shadow-[0_10px_26px_rgba(18,71,117,0.34)] transition hover:scale-105 lg:bottom-8 lg:right-8"
      >
        <Plus size={28} />
      </Link>
    </main>
  );
}
