"use client";

import {
  ArrowLeft,
  UserRound,
  Building2,
  BriefcaseBusiness,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  NotebookPen,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import HistorialCambios from "@/components/historial/HistorialCambios";
import { createClient } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  legajo: string | null;
  fecha_nacimiento: string | null;
  dependencia_id: string | null;
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

type Dependencia = {
  id: string;
  nombre: string;
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
  const [form, setForm] = useState<Persona | null>(null);

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  async function cargarPersona() {
    const { data, error } = await supabase
      .from("personas")
      .select(`
        id,
        nombre,
        apellido,
        legajo,
        fecha_nacimiento,
        dependencia_id,
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

    if (!error && data) {
      setPersona(data as unknown as Persona);
      setForm(data as unknown as Persona);
    }
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: deps } = await supabase
        .from("dependencias")
        .select("id,nombre")
        .eq("activa", true)
        .order("nombre");

      setDependencias(deps || []);

      await cargarPersona();

      const { data: regs } = await supabase
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

      setRegistros(regs || []);
      setCargando(false);
    }

    iniciar();
  }, [id]);

  function cambiar(
    campo: keyof Persona,
    valor: string | null
  ) {
    if (!form) return;

    setForm({
      ...form,
      [campo]: valor,
    });
  }

  async function guardarCambios() {
    if (!form) return;

    setGuardando(true);
    setMensaje("");

    const { error } = await supabase
      .from("personas")
      .update({
        dependencia_id:
          form.dependencia_id || null,

        area:
          form.area?.trim() || null,

        cargo:
          form.cargo?.trim() || null,

        funcion:
          form.funcion?.trim() || null,

        tipo_contratacion:
          form.tipo_contratacion?.trim() || null,

        categoria:
          form.categoria?.trim() || null,

        horas:
          form.horas?.trim() || null,

        telefono:
          form.telefono?.trim() || null,

        email:
          form.email?.trim() || null,

        direccion:
          form.direccion?.trim() || null,

        tareas_especificas:
          form.tareas_especificas?.trim() || null,

        descripcion_tareas:
          form.descripcion_tareas?.trim() || null,

        observaciones:
          form.observaciones?.trim() || null,

        contacto_emergencia:
          form.contacto_emergencia?.trim() || null,

        telefono_emergencia:
          form.telefono_emergencia?.trim() || null,

        vencimiento:
          form.vencimiento || null,

        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("No se pudieron guardar los cambios.");
      setGuardando(false);
      return;
    }

    await cargarPersona();

    setEditando(false);
    setGuardando(false);
    setMensaje("Cambios guardados correctamente.");
  }

  function cancelarEdicion() {
    setForm(persona);
    setEditando(false);
    setMensaje("");
  }

  if (cargando) {
    return (
      <AppShell activo="Personal">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2
            size={24}
            className="animate-spin"
          />
        </div>
      </AppShell>
    );
  }

  if (!persona || !form) {
    return (
      <AppShell activo="Personal">
        <div className="p-8">
          No se encontró la persona.
        </div>
      </AppShell>
    );
  }

  const nombreCompleto =
    `${persona.nombre}${
      persona.apellido
        ? ` ${persona.apellido}`
        : ""
    }`;

  return (
    <AppShell activo="Personal">

      <header className="border-b border-slate-400 bg-white">

        <div className="flex items-center justify-between px-5 py-4 md:px-8">

          <a
            href="/personal"
            className="inline-flex items-center gap-2 text-sm text-black"
          >
            <ArrowLeft size={17} />
            Personal
          </a>

          {!editando ? (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-black"
            >
              <Pencil size={17} />
              Editar
            </button>
          ) : (
            <div className="flex gap-2">

              <button
                onClick={cancelarEdicion}
                className="flex items-center gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm"
              >
                <X size={17} />
                Cancelar
              </button>

              <button
                onClick={guardarCambios}
                disabled={guardando}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {guardando ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                Guardar
              </button>

            </div>
          )}

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        {mensaje && (
          <div className="mb-5 rounded-xl border border-slate-400 bg-white px-4 py-3 text-sm">
            {mensaje}
          </div>
        )}

        <section className="rounded-2xl border border-slate-400 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

            <div className="flex gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <UserRound size={30} />
              </div>

              <div>

                <h1 className="text-2xl font-semibold">
                  {nombreCompleto}
                </h1>

                <p className="mt-1 text-sm text-black">
                  {persona.cargo || "Sin cargo"}
                </p>

                {persona.dependencia && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-black">
                    <Building2 size={15} />
                    {persona.dependencia.nombre}
                  </div>
                )}

              </div>

            </div>

            <div className="rounded-xl border border-slate-400 bg-slate-100 px-5 py-3">

              <p className="text-xs text-black">
                Legajo
              </p>

              <p className="text-4xl font-extrabold text-black">
                {persona.legajo || "Sin dato"}
              </p>

            </div>

          </div>

        </section>

        {editando ? (
          <section className="mt-5 rounded-2xl border border-sky-300 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold">
              Editar información
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <CampoEdicion
                titulo="Dependencia"
              >
                <select
                  value={form.dependencia_id || ""}
                  onChange={(e) =>
                    cambiar(
                      "dependencia_id",
                      e.target.value
                    )
                  }
                  className="campo"
                >
                  <option value="">
                    Sin dependencia
                  </option>

                  {dependencias.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </CampoEdicion>

              <Entrada
                titulo="Área"
                valor={form.area}
                cambio={(v) => cambiar("area", v)}
              />

              <Entrada
                titulo="Cargo"
                valor={form.cargo}
                cambio={(v) => cambiar("cargo", v)}
              />

              <Entrada
                titulo="Función"
                valor={form.funcion}
                cambio={(v) => cambiar("funcion", v)}
              />

              <Entrada
                titulo="Contratación"
                valor={form.tipo_contratacion}
                cambio={(v) =>
                  cambiar("tipo_contratacion", v)
                }
              />

              <Entrada
                titulo="Categoría"
                valor={form.categoria}
                cambio={(v) =>
                  cambiar("categoria", v)
                }
              />

              <Entrada
                titulo="Horas"
                valor={form.horas}
                cambio={(v) => cambiar("horas", v)}
              />

              <Entrada
                titulo="Teléfono"
                valor={form.telefono}
                cambio={(v) => cambiar("telefono", v)}
              />

              <Entrada
                titulo="Email"
                valor={form.email}
                cambio={(v) => cambiar("email", v)}
              />

              <Entrada
                titulo="Dirección"
                valor={form.direccion}
                cambio={(v) => cambiar("direccion", v)}
              />

              <CampoEdicion titulo="Vencimiento">
                <input
                  type="date"
                  value={form.vencimiento || ""}
                  onChange={(e) =>
                    cambiar(
                      "vencimiento",
                      e.target.value
                    )
                  }
                  className="campo"
                />
              </CampoEdicion>

              <Entrada
                titulo="Contacto de emergencia"
                valor={form.contacto_emergencia}
                cambio={(v) =>
                  cambiar(
                    "contacto_emergencia",
                    v
                  )
                }
              />

              <Entrada
                titulo="Teléfono emergencia"
                valor={form.telefono_emergencia}
                cambio={(v) =>
                  cambiar(
                    "telefono_emergencia",
                    v
                  )
                }
              />

            </div>

            <div className="mt-4 grid gap-4">

              <AreaTexto
                titulo="Tareas específicas"
                valor={form.tareas_especificas}
                cambio={(v) =>
                  cambiar(
                    "tareas_especificas",
                    v
                  )
                }
              />

              <AreaTexto
                titulo="Descripción de tareas"
                valor={form.descripcion_tareas}
                cambio={(v) =>
                  cambiar(
                    "descripcion_tareas",
                    v
                  )
                }
              />

              <AreaTexto
                titulo="Observaciones"
                valor={form.observaciones}
                cambio={(v) =>
                  cambiar("observaciones", v)
                }
              />

            </div>

          </section>
        ) : (
          <>
            <section className="mt-5 grid gap-4 lg:grid-cols-2">

              <Bloque
                titulo="Información laboral"
                icono={BriefcaseBusiness}
              >
                <Dato
                  titulo="Área"
                  valor={persona.area}
                />

                <Dato
                  titulo="Cargo"
                  valor={persona.cargo}
                />

                <Dato
                  titulo="Función"
                  valor={persona.funcion}
                />

                <Dato
                  titulo="Contratación"
                  valor={persona.tipo_contratacion}
                />

                <Dato
                  titulo="Categoría"
                  valor={persona.categoria}
                />

                <Dato
                  titulo="Horas"
                  valor={persona.horas}
                />

                <Dato
                  titulo="Ingreso"
                  valor={
                    persona.anio_ingreso
                      ? String(persona.anio_ingreso)
                      : fecha(persona.fecha_ingreso)
                  }
                />

                <Dato
                  titulo="Vencimiento"
                  valor={fecha(persona.vencimiento)}
                />
              </Bloque>

              <Bloque
                titulo="Contacto"
                icono={Phone}
              >

                <DatoIcono
                  icono={Phone}
                  titulo="Teléfono"
                  valor={persona.telefono}
                />

                <DatoIcono
                  icono={Mail}
                  titulo="Email"
                  valor={persona.email}
                />

                <DatoIcono
                  icono={MapPin}
                  titulo="Dirección"
                  valor={persona.direccion}
                />

                <Dato
                  titulo="Nacimiento"
                  valor={fecha(
                    persona.fecha_nacimiento
                  )}
                />

              </Bloque>

              <Bloque
                titulo="Tareas"
                icono={BriefcaseBusiness}
              >

                <Dato
                  titulo="Tareas específicas"
                  valor={persona.tareas_especificas}
                />

                <Dato
                  titulo="Descripción"
                  valor={persona.descripcion_tareas}
                />

              </Bloque>

              <Bloque
                titulo="Emergencia"
                icono={ShieldAlert}
              >

                <Dato
                  titulo="Contacto"
                  valor={
                    persona.contacto_emergencia
                  }
                />

                <Dato
                  titulo="Teléfono"
                  valor={
                    persona.telefono_emergencia
                  }
                />

              </Bloque>

            </section>

            {persona.observaciones && (
              <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

                <h2 className="font-semibold">
                  Observaciones
                </h2>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-black">
                  {persona.observaciones}
                </p>

              </section>
            )}
          </>
        )}

        <HistorialCambios
          entidad="personas"
          entidadId={persona.id}
        />
        <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <NotebookPen
              size={20}
              className="text-sky-700"
            />

            <div>
              <h2 className="font-semibold">
                Registros relacionados
              </h2>

              <p className="text-sm text-black">
                {registros.length} registros
              </p>
            </div>

          </div>

          {registros.length > 0 ? (
            <div className="mt-4 space-y-3">

              {registros.map((registro) => (
                <div
                  key={registro.id}
                  className="rounded-xl border border-slate-400 bg-slate-100 p-4"
                >

                  <p className="text-xs font-semibold uppercase text-sky-700">
                    {registro.tipo || "Registro"}
                  </p>

                  <h3 className="mt-1 font-semibold">
                    {registro.titulo ||
                      "Sin título"}
                  </h3>

                  {registro.contenido && (
                    <p className="mt-2 text-sm text-black">
                      {registro.contenido}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-black">
                    {fechaHora(registro.created_at)}
                  </p>

                </div>
              ))}

            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-400 bg-slate-100 p-8 text-center text-sm text-black">
              No hay registros relacionados.
            </div>
          )}

        </section>

      </div>

      <style jsx global>{`
        .campo {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.75rem;
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .campo:focus {
          border-color: rgb(8 145 178);
        }
      `}</style>

    </AppShell>
  );
}

function CampoEdicion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-1 block text-sm font-medium text-black">
        {titulo}
      </label>

      {children}

    </div>
  );
}

function Entrada({
  titulo,
  valor,
  cambio,
}: {
  titulo: string;
  valor: string | null;
  cambio: (valor: string) => void;
}) {
  return (
    <CampoEdicion titulo={titulo}>

      <input
        value={valor || ""}
        onChange={(e) =>
          cambio(e.target.value)
        }
        className="campo"
      />

    </CampoEdicion>
  );
}

function AreaTexto({
  titulo,
  valor,
  cambio,
}: {
  titulo: string;
  valor: string | null;
  cambio: (valor: string) => void;
}) {
  return (
    <CampoEdicion titulo={titulo}>

      <textarea
        value={valor || ""}
        onChange={(e) =>
          cambio(e.target.value)
        }
        rows={4}
        className="campo"
      />

    </CampoEdicion>
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
          className="text-sky-700"
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

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | null | undefined;
}) {
  if (!valor) return null;

  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-black">
        {titulo}
      </p>

      <p className="mt-1 text-sm text-black">
        {valor}
      </p>

    </div>
  );
}

function DatoIcono({
  icono: Icon,
  titulo,
  valor,
}: {
  icono: React.ElementType;
  titulo: string;
  valor: string | null | undefined;
}) {
  if (!valor) return null;

  return (
    <div className="flex items-start gap-3">

      <Icon
        size={16}
        className="mt-0.5 text-black"
      />

      <div>

        <p className="text-xs font-medium uppercase tracking-wide text-black">
          {titulo}
        </p>

        <p className="mt-1 text-sm text-black">
          {valor}
        </p>

      </div>

    </div>
  );
}








