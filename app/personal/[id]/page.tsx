"use client";

import {
  ArrowLeft,
  UserRound,
  Building2,
  BriefcaseBusiness,
  Clock3,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  FileText,
  ShieldAlert,
  NotebookPen,
  Loader2,
} from "lucide-react";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
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
  observaciones: string | null;
  tareas_especificas: string | null;
  descripcion_tareas: string | null;
  vencimiento: string | null;
  fuente: string | null;

  dependencia: {
    id: string;
    nombre: string;
  } | null;
};

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
  created_at: string;
};

function fecha(valor: string | null) {
  if (!valor) return null;

  const [a, m, d] = valor.split("-");

  return `${d}/${m}/${a}`;
}

function fechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PersonaDetallePage() {
  const params = useParams();
  const id = String(params.id || "");
  const supabase = createClient();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
          observaciones,
          tareas_especificas,
          descripcion_tareas,
          vencimiento,
          fuente,
          dependencia:dependencias(
            id,
            nombre
          )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("No se pudo cargar la persona.");
        setCargando(false);
        return;
      }

      setPersona(data as Persona);

      const { data: registrosData } = await supabase
        .from("registros")
        .select(`
          id,
          titulo,
          contenido,
          tipo,
          created_at
        `)
        .eq("persona_id", id)
        .order("created_at", {
          ascending: false,
        });

      setRegistros(registrosData || []);
      setCargando(false);
    }

    cargar();
  }, [id]);

  if (cargando) {
    return (
      <AppShell activo="Personal">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Cargando ficha...
          </div>
        </div>
      </AppShell>
    );
  }

  if (!persona) {
    return (
      <AppShell activo="Personal">
        <div className="p-8">
          <div className="rounded-2xl border border-red-300 bg-white p-6">
            {error}
          </div>
        </div>
      </AppShell>
    );
  }

  const nombreCompleto =
    `${persona.nombre}${persona.apellido ? ` ${persona.apellido}` : ""}`;

  return (
    <AppShell activo="Personal">

      <header className="border-b border-slate-300 bg-white">
        <div className="px-5 py-4 md:px-8">

          <a
            href="/personal"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Personal
          </a>

        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <section className="rounded-2xl border border-slate-400 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <UserRound size={30} />
              </div>

              <div>

                <h1 className="text-2xl font-semibold">
                  {nombreCompleto}
                </h1>

                {persona.cargo && (
                  <p className="mt-1 text-sm text-slate-600">
                    {persona.cargo}
                  </p>
                )}

                {persona.dependencia && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <Building2 size={15} />
                    {persona.dependencia.nombre}
                  </div>
                )}

              </div>

            </div>

            <div className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-3">

              <p className="text-xs text-slate-500">
                Legajo
              </p>

              <p className="text-lg font-semibold">
                {persona.legajo || "Sin dato"}
              </p>

            </div>

          </div>

        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">

          <Bloque
            titulo="Información laboral"
            icono={BriefcaseBusiness}
          >

            <Campo
              nombre="Área"
              valor={persona.area}
            />

            <Campo
              nombre="Cargo"
              valor={persona.cargo}
            />

            <Campo
              nombre="Función"
              valor={persona.funcion}
            />

            <Campo
              nombre="Contratación"
              valor={persona.tipo_contratacion}
            />

            <Campo
              nombre="Categoría"
              valor={persona.categoria}
            />

            <Campo
              nombre="Horas"
              valor={persona.horas}
            />

            <Campo
              nombre="Año de ingreso"
              valor={
                persona.anio_ingreso
                  ? String(persona.anio_ingreso)
                  : fecha(persona.fecha_ingreso)
              }
            />

            <Campo
              nombre="Vencimiento"
              valor={fecha(persona.vencimiento)}
            />

          </Bloque>

          <Bloque
            titulo="Datos personales"
            icono={UserRound}
          >

            <Campo
              nombre="Fecha de nacimiento"
              valor={fecha(persona.fecha_nacimiento)}
            />

            <CampoIcono
              icono={Phone}
              nombre="Teléfono"
              valor={persona.telefono}
            />

            <CampoIcono
              icono={Mail}
              nombre="Email"
              valor={persona.email}
            />

            <CampoIcono
              icono={MapPin}
              nombre="Dirección"
              valor={persona.direccion}
            />

          </Bloque>

          <Bloque
            titulo="Tareas"
            icono={Clock3}
          >

            <Campo
              nombre="Tareas específicas"
              valor={persona.tareas_especificas}
            />

            <Campo
              nombre="Descripción"
              valor={persona.descripcion_tareas}
            />

          </Bloque>

          <Bloque
            titulo="Emergencia"
            icono={ShieldAlert}
          >

            <Campo
              nombre="Contacto"
              valor={persona.contacto_emergencia}
            />

            <Campo
              nombre="Teléfono"
              valor={persona.telefono_emergencia}
            />

          </Bloque>

        </section>

        {persona.observaciones && (
          <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <FileText
                size={20}
                className="text-cyan-700"
              />

              <h2 className="font-semibold">
                Observaciones
              </h2>

            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {persona.observaciones}
            </p>

          </section>
        )}

        <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <NotebookPen
                size={20}
                className="text-cyan-700"
              />

              <div>
                <h2 className="font-semibold">
                  Registros relacionados
                </h2>

                <p className="text-sm text-slate-500">
                  {registros.length} registros
                </p>
              </div>

            </div>

          </div>

          {registros.length > 0 ? (
            <div className="mt-4 space-y-3">

              {registros.map((registro) => (
                <div
                  key={registro.id}
                  className="rounded-xl border border-slate-300 bg-slate-50 p-4"
                >

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <p className="text-xs font-semibold uppercase text-cyan-700">
                        {registro.tipo || "Registro"}
                      </p>

                      <h3 className="mt-1 font-semibold">
                        {registro.titulo || "Sin título"}
                      </h3>

                    </div>

                    <span className="text-xs text-slate-400">
                      {fechaHora(registro.created_at)}
                    </span>

                  </div>

                  {registro.contenido && (
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {registro.contenido}
                    </p>
                  )}

                </div>
              ))}

            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <p className="text-sm text-slate-400">
                No hay registros asociados a esta persona.
              </p>

            </div>
          )}

        </section>

        {persona.fuente && (
          <p className="mt-4 text-xs text-slate-400">
            Fuente: {persona.fuente}
          </p>
        )}

      </div>

    </AppShell>
  );
}

function Bloque({
  titulo,
  icono: Icon,
  children,
}: {
  titulo: string;
  icono: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <Icon
          size={20}
          className="text-cyan-700"
        />

        <h2 className="font-semibold">
          {titulo}
        </h2>

      </div>

      <div className="mt-5 space-y-4">
        {children}
      </div>

    </section>
  );
}

function Campo({
  nombre,
  valor,
}: {
  nombre: string;
  valor: string | null | undefined;
}) {
  if (!valor) return null;

  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {nombre}
      </p>

      <p className="mt-1 text-sm text-slate-700">
        {valor}
      </p>

    </div>
  );
}

function CampoIcono({
  icono: Icon,
  nombre,
  valor,
}: {
  icono: React.ElementType;
  nombre: string;
  valor: string | null | undefined;
}) {
  if (!valor) return null;

  return (
    <div className="flex items-start gap-3">

      <Icon
        size={16}
        className="mt-0.5 text-slate-400"
      />

      <div>

        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {nombre}
        </p>

        <p className="mt-1 text-sm text-slate-700">
          {valor}
        </p>

      </div>

    </div>
  );
}
