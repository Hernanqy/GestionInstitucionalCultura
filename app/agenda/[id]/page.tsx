"use client";

import AccionesEvento from "@/components/AccionesEvento";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  FileText,
  Building2,
  CircleDollarSign,
  PackageOpen,
  Store,
  Loader2,
  BadgeCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  responsable: string | null;
  expediente: string | null;
  descripcion: string | null;
  necesidades: string | null;
  proveedor: string | null;
  costo: number | null;
  estado: string | null;

  dependencias: {
    id: string;
    nombre: string;
  } | null;
};

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  return new Date(
    `${fecha}T12:00:00`
  ).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatearHora(hora: string | null) {
  if (!hora) return "Sin horario";
  return hora.slice(0, 5);
}

function formatearCosto(costo: number | null) {
  if (costo === null) return null;

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(costo);
}

export default function EventoDetallePage() {
  const params = useParams();
  const id = String(params.id || "");

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [evento, setEvento] =
    useState<Evento | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

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
        .from("eventos")
        .select(`
          id,
          nombre,
          fecha,
          hora,
          lugar,
          responsable,
          expediente,
          descripcion,
          necesidades,
          proveedor,
          costo,
          estado,
          dependencias (
            id,
            nombre
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setError(
          "No se pudo cargar el evento."
        );
        setCargando(false);
        return;
      }

      setEvento(
        data as unknown as Evento
      );

      setCargando(false);
    }

    cargar();
  }, [id, supabase]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
      <div className="mb-5 flex justify-end">
        <AccionesEvento />
      </div>

<div className="mb-5 flex justify-end">

</div>



        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Cargando evento...
        </div>
      </main>
    );
  }

  if (!evento) {
    return (
      <main className="min-h-screen bg-[#edf4f8] p-8">

        <div
          className="
            rounded-2xl
            border border-red-300
            bg-white
            p-6
          "
        >
          {error || "Evento no encontrado."}
        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-slate-900 lg:pb-10">

      <div className="mx-auto max-w-[1350px] px-5 py-7 md:px-8">

        <a
          href="/agenda"
          className="
            inline-flex items-center gap-2
            text-sm font-semibold
            text-slate-600
            hover:text-slate-900
          "
        >
          <ArrowLeft size={18} />
          Agenda
        </a>

        {/* CABECERA */}

        <section
          className="
            mt-5
            rounded-[24px]
            border border-slate-300
            bg-white
            p-6
            shadow-[0_8px_22px_rgba(15,23,42,0.06)]
          "
        >

          <div
            className="
              flex flex-col gap-6
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >

            <div className="flex items-start gap-5">

              <div
                className="
                  flex h-20 w-20
                  shrink-0
                  items-center justify-center
                  rounded-[22px]
                  bg-gradient-to-br
                  from-amber-100
                  to-orange-200
                  text-[42px]
                  shadow-sm
                "
              >
                📅
              </div>

              <div>

                <h1 className="text-3xl font-bold leading-tight">
                  {evento.nombre}
                </h1>

                <div className="mt-4 space-y-2 text-sm text-slate-500">

                  <div className="flex items-center gap-2">
                    <CalendarDays size={17} />

                    {formatearFecha(
                      evento.fecha
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock3 size={17} />

                    {formatearHora(
                      evento.hora
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={17} />

                    {evento.lugar ||
                      "Lugar no cargado"}
                  </div>

                </div>

              </div>

            </div>

            <div
              className="
                rounded-xl
                border border-slate-300
                bg-slate-50
                px-5 py-3
              "
            >
              <p className="text-xs text-slate-500">
                Estado
              </p>

              <p className="mt-1 font-bold capitalize">
                {evento.estado ||
                  "Sin estado"}
              </p>
              <AccionesEvento />
            </div>

          </div>

        </section>

        {/* DATOS */}

        <section className="mt-5 grid gap-5 xl:grid-cols-2">

          <Tarjeta titulo="Información">

            <Fila
              icono={Building2}
              etiqueta="Dependencia"
              valor={
                evento.dependencias?.nombre
              }
            />

            <Fila
              icono={UserRound}
              etiqueta="Responsable"
              valor={evento.responsable}
            />

            <Fila
              icono={FileText}
              etiqueta="Expediente"
              valor={evento.expediente}
            />

            <Fila
              icono={BadgeCheck}
              etiqueta="Estado"
              valor={evento.estado}
            />

          </Tarjeta>

          <Tarjeta titulo="Contratación y recursos">

            <Fila
              icono={Store}
              etiqueta="Proveedor"
              valor={evento.proveedor}
            />

            <Fila
              icono={CircleDollarSign}
              etiqueta="Costo"
              valor={formatearCosto(
                evento.costo
              )}
            />

            <Fila
              icono={PackageOpen}
              etiqueta="Necesidades"
              valor={evento.necesidades}
            />

          </Tarjeta>

        </section>

        {evento.descripcion && (
          <section className="mt-5">
            <Tarjeta titulo="Descripción">

              <p className="leading-7 text-slate-700">
                {evento.descripcion}
              </p>

            </Tarjeta>
          </section>
        )}

      </div>
    </main>
  );
}

function Tarjeta({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-[22px]
        border border-slate-300
        bg-white
        p-6
        shadow-[0_6px_18px_rgba(15,23,42,0.05)]
      "
    >
      <h2 className="text-lg font-bold">
        {titulo}
      </h2>

      <div className="mt-5">
        {children}
      </div>
    </div>
  );
}

function Fila({
  icono: Icon,
  etiqueta,
  valor,
}: {
  icono: React.ElementType;
  etiqueta: string;
  valor: string | null | undefined;
}) {
  return (
    <div
      className="
        flex items-start gap-4
        border-b border-slate-100
        py-3
        last:border-0
      "
    >
      <div
        className="
          flex h-9 w-9
          shrink-0
          items-center justify-center
          rounded-xl
          bg-slate-100
          text-cyan-700
        "
      >
        <Icon size={17} />
      </div>

      <div>
        <p
          className="
            text-xs font-semibold
            uppercase tracking-wide
            text-slate-400
          "
        >
          {etiqueta}
        </p>

        <p className="mt-1 text-sm font-medium text-slate-700">
          {valor || "Sin dato"}
        </p>
      </div>

    </div>
  );
}






