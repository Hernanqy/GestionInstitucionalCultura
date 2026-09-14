"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
};

type Pendiente = {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: string | null;
  fecha_limite: string | null;
};

type Modulo = {
  titulo: string;
  subtitulo: string;
  emoji: string;
  href: string;
};

function codigoEmoji(emoji: string) {
  return Array.from(emoji)
    .map((caracter) => caracter.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-");
}

function Icono3D({
  emoji,
  size = 86,
}: {
  emoji: string;
  size?: number;
}) {
  const codigo = codigoEmoji(emoji);

  return (
    <div
      className="
        flex items-center justify-center
        rounded-[26px]
        border border-slate-200
        bg-gradient-to-br from-white to-slate-100
        shadow-[0_10px_24px_rgba(15,23,42,0.09)]
      "
      style={{
        width: size + 32,
        height: size + 32,
      }}
    >
      <img
        src={`https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/${codigo}.webp`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="
          select-none
          object-contain
          drop-shadow-[0_8px_8px_rgba(15,23,42,0.16)]
        "
      />
    </div>
  );
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  const date = new Date(`${fecha}T12:00:00`);

  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatearHora(hora: string | null) {
  if (!hora) return "Sin horario";
  return hora.slice(0, 5);
}

export default function HomePage() {
  const supabase = useMemo(() => createClient(), []);

  const [cargando, setCargando] = useState(true);

  const [cantidadPersonal, setCantidadPersonal] = useState(0);
  const [cantidadDependencias, setCantidadDependencias] = useState(0);
  const [cantidadRegistros, setCantidadRegistros] = useState(0);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);

  const [busqueda, setBusqueda] = useState("");

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

      const hoy = new Date();

      const fechaHoy = [
        hoy.getFullYear(),
        String(hoy.getMonth() + 1).padStart(2, "0"),
        String(hoy.getDate()).padStart(2, "0"),
      ].join("-");

      const [
        personalResult,
        dependenciasResult,
        registrosResult,
        eventosResult,
        pendientesResult,
      ] = await Promise.all([
        supabase
          .from("personas")
          .select("*", { count: "exact", head: true })
          .eq("activo", true),

        supabase
          .from("dependencias")
          .select("*", { count: "exact", head: true })
          .eq("activa", true),

        supabase
          .from("registros")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("eventos")
          .select("id,nombre,fecha,hora,lugar")
          .gte("fecha", fechaHoy)
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true })
          .limit(5),

        supabase
          .from("pendientes")
          .select(
            "id,titulo,descripcion,prioridad,fecha_limite"
          )
          .eq("completado", false)
          .order("fecha_limite", {
            ascending: true,
            nullsFirst: false,
          })
          .limit(4),
      ]);

      setCantidadPersonal(personalResult.count || 0);
      setCantidadDependencias(dependenciasResult.count || 0);
      setCantidadRegistros(registrosResult.count || 0);

      setEventos(eventosResult.data || []);
      setPendientes(pendientesResult.data || []);

      setCargando(false);
    }

    cargar();
  }, [supabase]);

  const proximoEvento = eventos[0] || null;

  const modulos: Modulo[] = [
    {
      titulo: "Inicio",
      subtitulo: "Vista principal",
      emoji: "🏠",
      href: "/",
    },
    {
      titulo: "Buscar",
      subtitulo: "Encontrá lo que necesitás",
      emoji: "🔎",
      href: "/buscar",
    },
    {
      titulo: "Registrar",
      subtitulo: "Cargar nueva información",
      emoji: "📝",
      href: "/registrar",
    },
    {
      titulo: "Agenda",
      subtitulo: "Actividades y eventos",
      emoji: "📅",
      href: "/agenda",
    },
    {
      titulo: "Pendientes",
      subtitulo: "Tareas y seguimientos",
      emoji: "📋",
      href: "/pendientes",
    },
    {
      titulo: "Dependencias",
      subtitulo: `${cantidadDependencias} espacios`,
      emoji: "🗂️",
      href: "/dependencias",
    },
    {
      titulo: "Personal",
      subtitulo: `${cantidadPersonal} registros`,
      emoji: "👥",
      href: "/personal",
    },
    {
      titulo: "Documentos",
      subtitulo: "Archivos y material",
      emoji: "📁",
      href: "/documentos",
    },
    {
      titulo: "Registros",
      subtitulo:
        cantidadRegistros > 0
          ? `${cantidadRegistros} registros`
          : "Notas, actas y bitácoras",
      emoji: "🗃️",
      href: "/registros",
    },
    {
      titulo: "Informes",
      subtitulo: "Estadísticas y reportes",
      emoji: "📊",
      href: "/informes",
    },
    {
      titulo: "Configuración",
      subtitulo: "Ajustes del sistema",
      emoji: "⚙️",
      href: "/configuracion",
    },
  ];

  function buscar(e: React.FormEvent) {
    e.preventDefault();

    const texto = busqueda.trim();

    if (!texto) return;

    window.location.href =
      `/buscar?q=${encodeURIComponent(texto)}`;
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Cargando gestión...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4f8] text-slate-900">

      {/* CABECERA */}

      <header className="border-b border-slate-200 bg-white">
        <div
          className="
            mx-auto
            flex max-w-[1580px]
            items-center gap-5
            px-6 py-4
          "
        >
          <form
            onSubmit={buscar}
            className="
              mx-auto
              flex w-full max-w-2xl
              items-center gap-3
              rounded-xl
              border border-slate-300
              bg-slate-50
              px-4 py-2.5
            "
          >
            <Search
              size={19}
              className="text-slate-500"
            />

            <input
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar en todo el sistema..."
              className="
                w-full
                bg-transparent
                text-sm text-slate-800
                outline-none
                placeholder:text-slate-500
              "
            />
          </form>

          <button
            className="
              rounded-xl p-2.5
              text-slate-500
              hover:bg-slate-100
            "
          >
            <Bell size={20} />
          </button>

          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-full
              bg-[#0f2f4d]
              text-sm font-bold text-white
            "
          >
            H
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1580px] px-6 py-8">

        {/* MI JORNADA */}

        <section>
          <h1 className="text-[31px] font-bold tracking-tight">
            Mi jornada
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Información que requiere atención
          </p>
        </section>

        <section
          className="
            mt-6
            grid gap-5
            xl:grid-cols-[1.7fr_1fr]
          "
        >
          <div className="space-y-5">

            {/* COMPROMISOS */}

            <div
              className="
                rounded-[20px]
                border border-slate-300
                bg-white
                p-6
                shadow-[0_5px_14px_rgba(15,23,42,0.04)]
              "
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    ⭐
                  </span>

                  <h2 className="text-[17px] font-bold">
                    Compromisos prioritarios
                  </h2>
                </div>

                <a
                  href="/pendientes"
                  className="text-sm font-semibold text-cyan-700"
                >
                  Ver todos
                </a>
              </div>

              {pendientes.length === 0 ? (
                <div
                  className="
                    mt-5
                    rounded-xl
                    border border-dashed border-slate-300
                    bg-slate-50
                    px-5 py-7
                    text-sm text-slate-500
                  "
                >
                  No hay compromisos pendientes.
                </div>
              ) : (
                <div className="mt-5 space-y-2">

                  {pendientes
                    .slice(0, 3)
                    .map((item) => (
                      <a
                        key={item.id}
                        href="/pendientes"
                        className="
                          flex items-center justify-between
                          rounded-xl
                          border border-slate-200
                          bg-slate-50
                          px-4 py-3
                          hover:bg-slate-100
                        "
                      >
                        <div>
                          <p className="font-semibold">
                            {item.titulo}
                          </p>

                          {item.fecha_limite && (
                            <p className="mt-1 text-xs text-slate-500">
                              Hasta{" "}
                              {formatearFecha(
                                item.fecha_limite
                              )}
                            </p>
                          )}
                        </div>

                        <ChevronRight
                          size={18}
                          className="text-slate-400"
                        />
                      </a>
                    ))}

                </div>
              )}
            </div>

            {/* MI LISTA */}

            <div
              className="
                rounded-[20px]
                border border-slate-300
                bg-white
                p-6
                shadow-[0_5px_14px_rgba(15,23,42,0.04)]
              "
            >
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    📋
                  </span>

                  <h2 className="text-[17px] font-bold">
                    Mi lista
                  </h2>
                </div>

                <a
                  href="/agenda"
                  className="text-sm font-semibold text-cyan-700"
                >
                  Ver todo
                </a>
              </div>

              <div className="mt-5">

                {eventos.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-5 py-6 text-sm text-slate-500">
                    No hay próximos eventos.
                  </div>
                ) : (
                  eventos.slice(0, 4).map((evento) => (
                    <a
                      key={evento.id}
                      href="/agenda"
                      className="
                        flex items-center gap-4
                        border-b border-slate-100
                        py-3.5
                        last:border-0
                      "
                    >
                      <div
                        className="
                          flex h-12 w-12
                          items-center justify-center
                          rounded-xl
                          bg-blue-50
                          text-2xl
                        "
                      >
                        📅
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {evento.nombre}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatearFecha(
                            evento.fecha
                          )}

                          {evento.hora
                            ? ` · ${formatearHora(
                                evento.hora
                              )}`
                            : ""}
                        </p>
                      </div>

                      <span
                        className="
                          rounded-full
                          bg-blue-50
                          px-3 py-1
                          text-xs font-medium
                          text-blue-700
                        "
                      >
                        evento
                      </span>
                    </a>
                  ))
                )}

              </div>
            </div>

          </div>

          {/* DERECHA */}

          <div className="space-y-5">

            <div
              className="
                rounded-[20px]
                border border-slate-300
                bg-white
                p-6
                shadow-[0_5px_14px_rgba(15,23,42,0.04)]
              "
            >
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    📅
                  </span>

                  <h2 className="text-[17px] font-bold">
                    Próximo evento
                  </h2>
                </div>

                <a
                  href="/agenda"
                  className="text-sm font-semibold text-cyan-700"
                >
                  Agenda
                </a>
              </div>

              {proximoEvento ? (
                <div className="mt-5 border-l-4 border-cyan-500 pl-5">

                  <h3 className="text-lg font-bold">
                    {proximoEvento.nombre}
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-slate-500">

                    <div className="flex items-center gap-3">
                      <CalendarDays size={16} />
                      {formatearFecha(
                        proximoEvento.fecha
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock3 size={16} />
                      {formatearHora(
                        proximoEvento.hora
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin size={16} />

                      {proximoEvento.lugar ||
                        "Sin lugar cargado"}
                    </div>

                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                  No hay próximos eventos.
                </div>
              )}

            </div>

            <div
              className="
                rounded-[20px]
                border border-slate-300
                bg-white
                p-6
                shadow-[0_5px_14px_rgba(15,23,42,0.04)]
              "
            >
              <div className="flex items-center gap-3">
                <Clock3
                  size={21}
                  className="text-cyan-600"
                />

                <h2 className="text-[17px] font-bold">
                  Esperando respuesta
                </h2>
              </div>

              <div
                className="
                  mt-5
                  rounded-xl
                  border border-dashed border-slate-300
                  bg-slate-50
                  px-5 py-8
                  text-center
                  text-sm text-slate-400
                "
              >
                Sin elementos por ahora.
              </div>
            </div>

          </div>
        </section>

        {/* MODULOS GRANDES */}

        <section className="mt-11">

          <p
            className="
              text-xs font-bold
              uppercase tracking-[0.18em]
              text-slate-500
            "
          >
            Consulta y gestión
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Accesos principales
          </h2>

          <div
            className="
              mt-6
              grid gap-5
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-6
            "
          >
            {modulos.map((modulo) => (

              <a
                key={modulo.titulo}
                href={modulo.href}
                className="
                  group
                  flex min-h-[285px]
                  flex-col
                  items-center
                  rounded-[26px]
                  border border-slate-300
                  bg-white
                  px-5 py-7
                  text-center
                  shadow-[0_8px_22px_rgba(15,23,42,0.06)]
                  transition-all duration-200

                  hover:-translate-y-1.5
                  hover:border-slate-400
                  hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]
                "
              >

                <Icono3D
                  emoji={modulo.emoji}
                  size={82}
                />

                <div className="mt-auto pt-7">

                  <h3
                    className="
                      text-[19px]
                      font-bold
                      tracking-tight
                      text-slate-900
                    "
                  >
                    {modulo.titulo}
                  </h3>

                  <p
                    className="
                      mx-auto mt-2
                      max-w-[150px]
                      text-[14px]
                      leading-5
                      text-slate-500
                    "
                  >
                    {modulo.subtitulo}
                  </p>

                </div>

              </a>

            ))}
          </div>

        </section>

      </div>
    </main>
  );
}
