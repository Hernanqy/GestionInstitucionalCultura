"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  UserRound,
  Building2,
  BriefcaseBusiness,
  BadgeCheck,
  Clock3,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  FileText,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  legajo: string | null;
  fecha_nacimiento: string | null;

  area: string | null;
  cargo: string | null;
  funcion: string | null;
  tipo_contratacion: string | null;
  categoria: string | null;
  horas: string | null;

  fecha_ingreso: string | null;
  anio_ingreso: number | null;

  telefono: string | null;
  email: string | null;
  direccion: string | null;

  contacto_emergencia: string | null;
  telefono_emergencia: string | null;

  tareas_especificas: string | null;
  descripcion_tareas: string | null;
  observaciones: string | null;

  dependencias: {
    id: string;
    nombre: string;
  } | null;
};

export default function PersonaDetallePage() {
  const params = useParams();
  const id = String(params.id || "");

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [persona, setPersona] =
    useState<Persona | null>(null);

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
        .from("personas")
        .select(`
          id,
          nombre,
          apellido,
          legajo,
          fecha_nacimiento,
          area,
          cargo,
          funcion,
          tipo_contratacion,
          categoria,
          horas,
          fecha_ingreso,
          anio_ingreso,
          telefono,
          email,
          direccion,
          contacto_emergencia,
          telefono_emergencia,
          tareas_especificas,
          descripcion_tareas,
          observaciones,
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
          "No se pudo cargar la persona."
        );
        setCargando(false);
        return;
      }

      setPersona(
        data as unknown as Persona
      );

      setCargando(false);
    }

    cargar();
  }, [id, supabase]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Cargando ficha...
        </div>
      </main>
    );
  }

  if (!persona) {
    return (
      <main className="min-h-screen bg-[#edf4f8] p-8">
        <div className="rounded-2xl border border-red-300 bg-white p-6">
          {error || "Persona no encontrada."}
        </div>
      </main>
    );
  }

  const nombreCompleto =
    `${persona.nombre}${
      persona.apellido
        ? ` ${persona.apellido}`
        : ""
    }`;

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-slate-900 lg:pb-10">

      <div className="mx-auto max-w-[1400px] px-5 py-7 md:px-8">

        <a
          href="/personal"
          className="
            inline-flex items-center gap-2
            text-sm font-semibold
            text-slate-600
            hover:text-slate-900
          "
        >
          <ArrowLeft size={18} />
          Personal
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
              flex flex-col gap-5
              md:flex-row
              md:items-start
              md:justify-between
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
                  from-cyan-100
                  to-blue-200
                  text-[38px]
                  shadow-sm
                "
              >
                👤
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  {nombreCompleto}
                </h1>

                {persona.cargo && (
                  <p className="mt-2 text-lg font-medium text-slate-700">
                    {persona.cargo}
                  </p>
                )}

                {persona.dependencias?.nombre && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Building2 size={17} />

                    {persona.dependencias.nombre}
                  </div>
                )}
              </div>

            </div>

            <div className="flex gap-3">

              <DatoCorto
                titulo="Legajo"
                valor={persona.legajo || "—"}
              />

              <DatoCorto
                titulo="Área"
                valor={persona.area || "—"}
              />

            </div>

          </div>
        </section>

        {/* INFORMACION */}

        <section className="mt-5 grid gap-5 xl:grid-cols-2">

          <Tarjeta titulo="Información laboral">

            <Fila
              icono={BriefcaseBusiness}
              etiqueta="Cargo"
              valor={persona.cargo}
            />

            <Fila
              icono={BadgeCheck}
              etiqueta="Función"
              valor={persona.funcion}
            />

            <Fila
              icono={ShieldCheck}
              etiqueta="Contratación"
              valor={persona.tipo_contratacion}
            />

            <Fila
              icono={FileText}
              etiqueta="Categoría"
              valor={persona.categoria}
            />

            <Fila
              icono={Clock3}
              etiqueta="Carga horaria"
              valor={persona.horas}
            />

            <Fila
              icono={CalendarDays}
              etiqueta="Ingreso"
              valor={
                persona.anio_ingreso
                  ? String(persona.anio_ingreso)
                  : persona.fecha_ingreso
              }
            />

          </Tarjeta>

          <Tarjeta titulo="Contacto">

            <Fila
              icono={Phone}
              etiqueta="Teléfono"
              valor={persona.telefono}
            />

            <Fila
              icono={Mail}
              etiqueta="Correo"
              valor={persona.email}
            />

            <Fila
              icono={MapPin}
              etiqueta="Dirección"
              valor={persona.direccion}
            />

            <Fila
              icono={UserRound}
              etiqueta="Contacto de emergencia"
              valor={persona.contacto_emergencia}
            />

            <Fila
              icono={Phone}
              etiqueta="Teléfono emergencia"
              valor={persona.telefono_emergencia}
            />

          </Tarjeta>

        </section>

        {(persona.tareas_especificas ||
          persona.descripcion_tareas) && (
          <section className="mt-5">
            <Tarjeta titulo="Funciones y tareas">

              {persona.tareas_especificas && (
                <BloqueTexto
                  titulo="Tareas específicas"
                  texto={persona.tareas_especificas}
                />
              )}

              {persona.descripcion_tareas && (
                <BloqueTexto
                  titulo="Descripción"
                  texto={persona.descripcion_tareas}
                />
              )}

            </Tarjeta>
          </section>
        )}

        {persona.observaciones && (
          <section className="mt-5">
            <Tarjeta titulo="Observaciones">

              <p className="leading-7 text-slate-700">
                {persona.observaciones}
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

      <div className="mt-5 space-y-1">
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
  valor: string | null;
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
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {etiqueta}
        </p>

        <p className="mt-1 text-sm font-medium text-slate-700">
          {valor || "Sin dato"}
        </p>
      </div>

    </div>
  );
}

function DatoCorto({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div
      className="
        min-w-[105px]
        rounded-xl
        border border-slate-300
        bg-slate-50
        px-4 py-3
      "
    >
      <p className="text-xs text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 font-bold">
        {valor}
      </p>
    </div>
  );
}

function BloqueTexto({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 leading-7 text-slate-700">
        {texto}
      </p>
    </div>
  );
}
