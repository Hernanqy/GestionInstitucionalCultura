"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Loader2,
  CalendarCheck2,
  CalendarClock,
  ListFilter,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  responsable: string | null;
  estado: string | null;
  dependencias: {
    id: string;
    nombre: string;
  } | null;
};

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const diasSemana = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

function fechaLocal(fecha: string) {
  return new Date(`${fecha}T12:00:00`);
}

function fechaISO(
  year: number,
  month: number,
  day: number
) {
  return [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  return fechaLocal(fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatearHora(hora: string | null) {
  if (!hora) return "Horario no cargado";
  return hora.slice(0, 5);
}

export default function AgendaPage() {
  const supabase = useMemo(() => createClient(), []);

  const hoy = useMemo(() => new Date(), []);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [buscar, setBuscar] = useState("");

  const [year, setYear] = useState(hoy.getFullYear());
  const [month, setMonth] = useState(hoy.getMonth());

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("eventos")
        .select(`
          id,
          nombre,
          fecha,
          hora,
          lugar,
          responsable,
          estado,
          dependencias (
            id,
            nombre
          )
        `)
        .order("fecha", { ascending: true })
        .range(0, 999);

      if (error) {
        console.error(error);
        setError("No se pudo cargar la agenda.");
        setCargando(false);
        return;
      }

      setEventos((data || []) as unknown as Evento[]);
      setCargando(false);
    }

    cargar();
  }, [supabase]);

  function mesAnterior() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function mesSiguiente() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function irAHoy() {
    const ahora = new Date();

    setYear(ahora.getFullYear());
    setMonth(ahora.getMonth());
  }

  const eventosFiltrados = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    return eventos.filter((evento) => {
      const contenido = [
        evento.nombre,
        evento.lugar,
        evento.responsable,
        evento.estado,
        evento.dependencias?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [eventos, buscar]);

  const eventosMes = useMemo(() => {
    return eventosFiltrados.filter((evento) => {
      if (!evento.fecha) return false;

      const fecha = fechaLocal(evento.fecha);

      return (
        fecha.getFullYear() === year &&
        fecha.getMonth() === month
      );
    });
  }, [eventosFiltrados, year, month]);

  const fechaHoy = fechaISO(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate()
  );

  const proximos = useMemo(() => {
    return eventos
      .filter(
        (evento) =>
          evento.fecha &&
          evento.fecha >= fechaHoy
      )
      .length;
  }, [eventos, fechaHoy]);

  const pasados = useMemo(() => {
    return eventos.filter(
      (evento) =>
        evento.fecha &&
        evento.fecha < fechaHoy
    ).length;
  }, [eventos, fechaHoy]);

  const primerDia = new Date(year, month, 1);

  let inicioSemana = primerDia.getDay();

  // JS: Domingo = 0
  // nuestra grilla: Lunes = 0
  inicioSemana =
    inicioSemana === 0 ? 6 : inicioSemana - 1;

  const diasDelMes = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const celdas = Array.from(
    {
      length:
        Math.ceil((inicioSemana + diasDelMes) / 7) * 7,
    },
    (_, index) => {
      const dia = index - inicioSemana + 1;

      if (dia < 1 || dia > diasDelMes) {
        return null;
      }

      return dia;
    }
  );

  function eventosDelDia(dia: number) {
    const iso = fechaISO(year, month, dia);

    return eventosMes.filter(
      (evento) => evento.fecha === iso
    );
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Cargando agenda...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-slate-900 lg:pb-10">

      <div className="mx-auto max-w-[1580px] px-5 py-7 md:px-8">

        {/* CABECERA */}

        <section
          className="
            flex flex-col gap-5
            xl:flex-row
            xl:items-end
            xl:justify-between
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                flex h-16 w-16
                items-center justify-center
                rounded-[20px]
                border border-orange-200
                bg-gradient-to-br
                from-amber-50
                to-orange-100
                text-[38px]
                shadow-sm
              "
            >
              📅
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Agenda
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Eventos, actividades y compromisos
              </p>
            </div>

          </div>

          <div
            className="
              flex w-full max-w-lg
              items-center gap-3
              rounded-2xl
              border border-slate-300
              bg-white
              px-4 py-3.5
              shadow-sm
            "
          >
            <Search
              size={20}
              className="text-slate-400"
            />

            <input
              value={buscar}
              onChange={(e) =>
                setBuscar(e.target.value)
              }
              placeholder="Buscar evento, lugar, responsable..."
              className="
                w-full bg-transparent
                text-sm outline-none
                placeholder:text-slate-400
              "
            />
          </div>

        </section>

        {/* RESUMEN */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Resumen
            icono="📆"
            titulo="Eventos cargados"
            valor={eventos.length}
          />

          <Resumen
            icono="⏳"
            titulo="Próximos"
            valor={proximos}
          />

          <Resumen
            icono="✅"
            titulo="Realizados"
            valor={pasados}
          />

          <Resumen
            icono="🗓️"
            titulo={`${meses[month]} ${year}`}
            valor={eventosMes.length}
          />

        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CONTROLES MES */}

        <section
          className="
            mt-6
            flex flex-col gap-4
            rounded-[20px]
            border border-slate-300
            bg-white
            p-5
            shadow-[0_5px_14px_rgba(15,23,42,0.04)]
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Calendario
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {meses[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={mesAnterior}
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                border border-slate-300
                bg-white
                hover:bg-slate-100
              "
            >
              <ChevronLeft size={19} />
            </button>

            <button
              onClick={irAHoy}
              className="
                rounded-xl
                border border-slate-300
                bg-white
                px-4 py-2.5
                text-sm font-semibold
                hover:bg-slate-100
              "
            >
              Hoy
            </button>

            <button
              onClick={mesSiguiente}
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                border border-slate-300
                bg-white
                hover:bg-slate-100
              "
            >
              <ChevronRight size={19} />
            </button>

          </div>

        </section>

        {/* CALENDARIO */}

        <section
          className="
            mt-5
            overflow-hidden
            rounded-[22px]
            border border-slate-300
            bg-white
            shadow-[0_7px_20px_rgba(15,23,42,0.05)]
          "
        >

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="
                  px-2 py-3
                  text-center
                  text-xs font-bold
                  uppercase tracking-wide
                  text-slate-500
                "
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">

            {celdas.map((dia, index) => {
              if (!dia) {
                return (
                  <div
                    key={`vacio-${index}`}
                    className="
                      min-h-[120px]
                      border-b border-r
                      border-slate-100
                      bg-slate-50/40
                    "
                  />
                );
              }

              const iso = fechaISO(
                year,
                month,
                dia
              );

              const esHoy =
                iso === fechaHoy;

              const eventosDia =
                eventosDelDia(dia);

              return (
                <div
                  key={iso}
                  className="
                    min-h-[120px]
                    border-b border-r
                    border-slate-100
                    p-2
                  "
                >

                  <div
                    className={`
                      flex h-7 w-7
                      items-center justify-center
                      rounded-full
                      text-xs font-bold
                      ${
                        esHoy
                          ? "bg-cyan-600 text-white"
                          : "text-slate-600"
                      }
                    `}
                  >
                    {dia}
                  </div>

                  <div className="mt-2 space-y-1">

                    {eventosDia
                      .slice(0, 2)
                      .map((evento) => (
                        <a
                          key={evento.id}
                          href={`/agenda/${evento.id}`}
                          className="
                            block truncate
                            rounded-lg
                            bg-cyan-50
                            px-2 py-1.5
                            text-[11px]
                            font-semibold
                            text-cyan-800
                            hover:bg-cyan-100
                          "
                        >
                          {evento.nombre}
                        </a>
                      ))}

                    {eventosDia.length > 2 && (
                      <p className="px-1 text-[10px] font-semibold text-slate-400">
                        +{eventosDia.length - 2} más
                      </p>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        {/* LISTADO DEL MES */}

        <section className="mt-7">

          <div className="mb-4 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <ListFilter
                size={19}
                className="text-cyan-700"
              />

              <h2 className="text-xl font-bold">
                Eventos del mes
              </h2>
            </div>

            <span className="text-sm text-slate-500">
              {eventosMes.length} resultados
            </span>

          </div>

          {eventosMes.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">

              {eventosMes.map((evento) => {

                const fecha = evento.fecha
                  ? fechaLocal(evento.fecha)
                  : null;

                return (
                  <a
                    key={evento.id}
                    href={`/agenda/${evento.id}`}
                    className="
                      group
                      flex gap-5
                      rounded-[20px]
                      border border-slate-300
                      bg-white
                      p-5
                      shadow-[0_5px_15px_rgba(15,23,42,0.04)]
                      transition

                      hover:-translate-y-0.5
                      hover:border-slate-400
                      hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]
                    "
                  >

                    <div
                      className="
                        flex h-20 w-20
                        shrink-0
                        flex-col
                        items-center justify-center
                        rounded-[18px]
                        bg-[#102b43]
                        text-white
                      "
                    >
                      <span className="text-xs font-semibold uppercase">
                        {fecha
                          ? meses[
                              fecha.getMonth()
                            ].slice(0, 3)
                          : "---"}
                      </span>

                      <span className="mt-1 text-2xl font-bold">
                        {fecha
                          ? fecha.getDate()
                          : "--"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <h3 className="text-lg font-bold">
                          {evento.nombre}
                        </h3>

                        <ChevronRight
                          size={19}
                          className="
                            shrink-0
                            text-slate-300
                            transition
                            group-hover:translate-x-1
                            group-hover:text-slate-600
                          "
                        />
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-slate-500">

                        <div className="flex items-center gap-2">
                          <Clock3 size={15} />
                          {formatearHora(evento.hora)}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin size={15} />
                          {evento.lugar ||
                            "Lugar no cargado"}
                        </div>

                        {evento.dependencias?.nombre && (
                          <div className="flex items-center gap-2">
                            <CalendarCheck2 size={15} />
                            {evento.dependencias.nombre}
                          </div>
                        )}

                      </div>

                    </div>

                  </a>
                );
              })}

            </div>
          ) : (
            <div
              className="
                rounded-[20px]
                border border-dashed border-slate-400
                bg-white
                p-12
                text-center
              "
            >
              <CalendarClock
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                No hay eventos cargados para este mes.
              </p>
            </div>
          )}

        </section>

      </div>
    </main>
  );
}

function Resumen({
  icono,
  titulo,
  valor,
}: {
  icono: string;
  titulo: string;
  valor: string | number;
}) {
  return (
    <div
      className="
        rounded-[20px]
        border border-slate-300
        bg-white
        p-5
        shadow-[0_5px_14px_rgba(15,23,42,0.04)]
      "
    >
      <div className="flex items-center gap-4">

        <div
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-2xl
            bg-slate-50
            text-2xl
          "
        >
          {icono}
        </div>

        <div>
          <p className="text-sm text-slate-500">
            {titulo}
          </p>

          <p className="mt-0.5 text-2xl font-bold">
            {valor}
          </p>
        </div>

      </div>
    </div>
  );
}
