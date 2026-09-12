"use client";

import {
  ArrowLeft,
  Building2,
  Users,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  FileText,
  Search,
  UserRound,
  Clock3,
  BriefcaseBusiness,
  Loader2,
  MapPin,
  Plus,
  Check,
  Circle,
  X,
  NotebookPen,
} from "lucide-react";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HistorialCambios from "@/components/historial/HistorialCambios";
import DocumentosPanel from "@/components/dependencias/DocumentosPanel";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  tipo_contratacion: string | null;
  horas: string | null;
  legajo: string | null;
};

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  responsable: string | null;
  estado: string | null;
};

type Pendiente = {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: string | null;
  fecha_limite: string | null;
  completado: boolean;
};

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
  created_at: string;
};

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  responsable: string | null;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
};

const tabs = [
  "Resumen",
  "Personal",
  "Agenda",
  "Pendientes",
  "Documentos",
  "Registros",
];

function crearSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  const [anio, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha: string) {
  const date = new Date(fecha);

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearHora(hora: string | null) {
  if (!hora) return "";
  return hora.slice(0, 5);
}

function clasePrioridad(prioridad: string | null) {
  if (prioridad === "alta") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (prioridad === "baja") {
    return "border-slate-400 bg-slate-100 text-slate-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function DependenciaDetallePage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const supabase = createClient();

  const [dependencia, setDependencia] = useState<Dependencia | null>(null);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const [tab, setTab] = useState("Resumen");
  const [buscar, setBuscar] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarNuevoPendiente, setMostrarNuevoPendiente] = useState(false);
  const [tituloPendiente, setTituloPendiente] = useState("");
  const [descripcionPendiente, setDescripcionPendiente] = useState("");
  const [prioridadPendiente, setPrioridadPendiente] = useState("normal");
  const [fechaPendiente, setFechaPendiente] = useState("");
  const [guardandoPendiente, setGuardandoPendiente] = useState(false);

  const [mostrarNuevoRegistro, setMostrarNuevoRegistro] = useState(false);
  const [tituloRegistro, setTituloRegistro] = useState("");
  const [contenidoRegistro, setContenidoRegistro] = useState("");
  const [tipoRegistro, setTipoRegistro] = useState("Nota");
  const [guardandoRegistro, setGuardandoRegistro] = useState(false);

  async function cargarPendientes(dependenciaId: string) {
    const { data } = await supabase
      .from("pendientes")
      .select(`
        id,
        titulo,
        descripcion,
        prioridad,
        fecha_limite,
        completado
      `)
      .eq("dependencia_id", dependenciaId)
      .order("completado", { ascending: true })
      .order("fecha_limite", { ascending: true, nullsFirst: false });

    setPendientes(data || []);
  }

  async function cargarRegistros(dependenciaId: string) {
    const { data, error } = await supabase
      .from("registros")
      .select(`
        id,
        titulo,
        contenido,
        tipo,
        created_at
      `)
      .eq("dependencia_id", dependenciaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setRegistros(data || []);
  }

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: listaDependencias } = await supabase
        .from("dependencias")
        .select("*")
        .eq("activa", true);

      const encontrada = (listaDependencias || []).find(
        (item) => crearSlug(item.nombre) === slug
      );

      if (!encontrada) {
        setError("No se encontró la dependencia.");
        setCargando(false);
        return;
      }

      setDependencia(encontrada);

      const { data: personas } = await supabase
        .from("personas")
        .select(`
          id,
          nombre,
          apellido,
          cargo,
          tipo_contratacion,
          horas,
          legajo
        `)
        .eq("dependencia_id", encontrada.id)
        .eq("activo", true)
        .order("nombre");

      setPersonal(personas || []);

      const { data: listaEventos } = await supabase
        .from("eventos")
        .select(`
          id,
          nombre,
          fecha,
          hora,
          lugar,
          responsable,
          estado
        `)
        .eq("dependencia_id", encontrada.id)
        .order("fecha", { ascending: true });

      setEventos(listaEventos || []);

      await cargarPendientes(encontrada.id);
      await cargarRegistros(encontrada.id);

      setCargando(false);
    }

    cargarDatos();
  }, [slug]);

  const personalFiltrado = useMemo(() => {
    const texto = buscar.toLowerCase().trim();

    return personal.filter((persona) => {
      const contenido = [
        persona.nombre,
        persona.apellido,
        persona.cargo,
        persona.tipo_contratacion,
        persona.legajo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [buscar, personal]);

  const pendientesActivos = useMemo(
    () => pendientes.filter((item) => !item.completado),
    [pendientes]
  );

  const proximoEvento = eventos[0] || null;

  async function crearPendiente() {
    if (!dependencia || !tituloPendiente.trim()) return;

    setGuardandoPendiente(true);

    const { error } = await supabase.from("pendientes").insert({
      titulo: tituloPendiente.trim(),
      descripcion: descripcionPendiente.trim() || null,
      prioridad: prioridadPendiente,
      fecha_limite: fechaPendiente || null,
      dependencia_id: dependencia.id,
      completado: false,
    });

    if (!error) {
      setTituloPendiente("");
      setDescripcionPendiente("");
      setPrioridadPendiente("normal");
      setFechaPendiente("");
      setMostrarNuevoPendiente(false);

      await cargarPendientes(dependencia.id);
    }

    setGuardandoPendiente(false);
  }

  async function cambiarEstadoPendiente(item: Pendiente) {
    if (!dependencia) return;

    await supabase
      .from("pendientes")
      .update({
        completado: !item.completado,
      })
      .eq("id", item.id);

    await cargarPendientes(dependencia.id);
  }

  async function crearRegistro() {
    if (!dependencia || !contenidoRegistro.trim()) return;

    setGuardandoRegistro(true);

    const { error } = await supabase.from("registros").insert({
      titulo: tituloRegistro.trim() || null,
      contenido: contenidoRegistro.trim(),
      tipo: tipoRegistro,
      dependencia_id: dependencia.id,
    });

    if (error) {
      alert("No se pudo guardar el registro.");
      setGuardandoRegistro(false);
      return;
    }

    setTituloRegistro("");
    setContenidoRegistro("");
    setTipoRegistro("Nota");
    setMostrarNuevoRegistro(false);

    await cargarRegistros(dependencia.id);

    setGuardandoRegistro(false);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-200/80">
        <Loader2 className="animate-spin" />
      </main>
    );
  }

  if (!dependencia) {
    return (
      <main className="p-10">
        {error}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-200/80 text-slate-900">
      <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8">

        <a
          href="/dependencias"
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft size={18} />
          Dependencias
        </a>

        <section className="rounded-2xl border border-slate-400 bg-white p-6 shadow-sm">

          <div className="flex justify-between">

            <div className="flex gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-sky-700">
                <Building2 />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">
                  {dependencia.nombre}
                </h1>

<a
  href={`/dependencias/${slug}/editar`}
  className="mt-3 inline-flex items-center rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
>
  Editar dependencia
</a>

                <p className="text-sm text-slate-600">
                  {dependencia.area}
                </p>
              </div>

            </div>

            <div className="flex gap-3">

              <Dato titulo="Personal" valor={personal.length} />
              <Dato titulo="Eventos" valor={eventos.length} />
              <Dato titulo="Pendientes" valor={pendientesActivos.length} />
              <Dato titulo="Registros" valor={registros.length} />

            </div>

          </div>

        </section>

        <div className="mt-5 flex gap-2">

          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl border px-4 py-2 ${
                tab === item
                  ? "bg-slate-900 text-white"
                  : "bg-white"
              }`}
            >
              {item}
            </button>
          ))}

        </div>

        {tab === "Resumen" && (
          <section className="mt-5 grid gap-4 lg:grid-cols-4">

            <Tarjeta
              titulo="Personal"
              valor={personal.length}
              texto="personas asociadas"
              onClick={() => setTab("Personal")}
            />

            <div className="rounded-2xl border border-slate-400 bg-white p-5">

              <h2 className="font-semibold">
                Agenda
              </h2>

              {proximoEvento ? (
                <div className="mt-4 rounded-xl border bg-slate-100 p-4">

                  <strong>
                    {proximoEvento.nombre}
                  </strong>

                  <p className="mt-1 text-sm">
                    {formatearFecha(proximoEvento.fecha)}
                  </p>

                  {proximoEvento.lugar && (
                    <p className="mt-1 text-sm text-slate-600">
                      {proximoEvento.lugar}
                    </p>
                  )}

                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-600">
                  Sin actividades.
                </p>
              )}

            </div>

            <Tarjeta
              titulo="Pendientes"
              valor={pendientesActivos.length}
              texto="pendientes activos"
              onClick={() => setTab("Pendientes")}
            />

            <Tarjeta
              titulo="Registros"
              valor={registros.length}
              texto="registros guardados"
              onClick={() => setTab("Registros")}
            />

          </section>
        )}

        {tab === "Personal" && (
          <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5">

            <div className="flex justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Personal
                </h2>

                <p className="text-sm text-slate-600">
                  {personal.length} personas
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border px-4">
                <Search size={18} />

                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar..."
                  className="py-3 outline-none"
                />
              </div>

            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">

              {personalFiltrado.map((persona) => (
                <div
                  key={persona.id}
                  className="rounded-xl border bg-slate-100 p-4"
                >

                  <div className="flex gap-3">

                    <UserRound />

                    <div>

                      <strong>
                        {persona.nombre}
                        {persona.apellido
                          ? ` ${persona.apellido}`
                          : ""}
                      </strong>

                      {persona.cargo && (
                        <p className="mt-2 text-sm">
                          {persona.cargo}
                        </p>
                      )}

                      {persona.horas && (
                        <p className="text-sm text-slate-600">
                          {persona.horas}
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              ))}

            </div>

          </section>
        )}

        {tab === "Agenda" && (
          <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5">

            <h2 className="text-lg font-semibold">
              Agenda
            </h2>

            <div className="mt-5 space-y-3">

              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="rounded-xl border bg-slate-100 p-4"
                >

                  <strong>{evento.nombre}</strong>

                  <p className="mt-1 text-sm">
                    {formatearFecha(evento.fecha)}
                  </p>

                  {evento.lugar && (
                    <p className="mt-1 text-sm text-slate-600">
                      {evento.lugar}
                    </p>
                  )}

                </div>
              ))}

            </div>

          </section>
        )}

        {tab === "Pendientes" && (
          <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5">

            <div className="flex justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Pendientes
                </h2>

                <p className="text-sm text-slate-600">
                  {pendientesActivos.length} activos
                </p>
              </div>

              <button
                onClick={() => setMostrarNuevoPendiente(true)}
                className="flex gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white"
              >
                <Plus size={18} />
                Nuevo pendiente
              </button>

            </div>

            {mostrarNuevoPendiente && (
              <div className="mt-5 rounded-xl border bg-slate-100 p-5">

                <div className="flex justify-between">

                  <strong>
                    Nuevo pendiente
                  </strong>

                  <X
                    className="cursor-pointer"
                    onClick={() => setMostrarNuevoPendiente(false)}
                  />

                </div>

                <div className="mt-4 grid gap-3">

                  <input
                    value={tituloPendiente}
                    onChange={(e) => setTituloPendiente(e.target.value)}
                    placeholder="Título"
                    className="rounded-xl border bg-white p-3"
                  />

                  <textarea
                    value={descripcionPendiente}
                    onChange={(e) => setDescripcionPendiente(e.target.value)}
                    placeholder="Descripción"
                    className="rounded-xl border bg-white p-3"
                  />

                  <select
                    value={prioridadPendiente}
                    onChange={(e) => setPrioridadPendiente(e.target.value)}
                    className="rounded-xl border bg-white p-3"
                  >
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>

                  <input
                    type="date"
                    value={fechaPendiente}
                    onChange={(e) => setFechaPendiente(e.target.value)}
                    className="rounded-xl border bg-white p-3"
                  />

                  <button
                    onClick={crearPendiente}
                    disabled={guardandoPendiente}
                    className="rounded-xl bg-slate-900 p-3 text-white"
                  >
                    Guardar
                  </button>

                </div>

              </div>
            )}

            <div className="mt-5 space-y-3">

              {pendientes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border bg-slate-100 p-4"
                >

                  <div className="flex gap-3">

                    <button
                      onClick={() => cambiarEstadoPendiente(item)}
                    >
                      {item.completado
                        ? <Check className="text-green-600" />
                        : <Circle />}
                    </button>

                    <div className="flex-1">

                      <div className="flex justify-between">

                        <strong>
                          {item.titulo}
                        </strong>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${clasePrioridad(
                            item.prioridad
                          )}`}
                        >
                          {item.prioridad}
                        </span>

                      </div>

                      {item.descripcion && (
                        <p className="mt-2 text-sm">
                          {item.descripcion}
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              ))}

            </div>

          </section>
        )}

        {tab === "Registros" && (
          <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5">

            <div className="flex justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Registros
                </h2>

                <p className="text-sm text-slate-600">
                  {registros.length} registros
                </p>
              </div>

              <button
                onClick={() => setMostrarNuevoRegistro(true)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white"
              >
                <Plus size={18} />
                Nuevo registro
              </button>

            </div>

            {mostrarNuevoRegistro && (
              <div className="mt-5 rounded-xl border border-slate-400 bg-slate-100 p-5">

                <div className="flex justify-between">

                  <h3 className="font-semibold">
                    Nuevo registro
                  </h3>

                  <button
                    onClick={() => setMostrarNuevoRegistro(false)}
                  >
                    <X size={18} />
                  </button>

                </div>

                <div className="mt-4 grid gap-3">

                  <select
                    value={tipoRegistro}
                    onChange={(e) => setTipoRegistro(e.target.value)}
                    className="rounded-xl border bg-white p-3"
                  >
                    <option>Nota</option>
                    <option>Reunión</option>
                    <option>Novedad</option>
                    <option>Observación</option>
                    <option>Antecedente</option>
                  </select>

                  <input
                    value={tituloRegistro}
                    onChange={(e) => setTituloRegistro(e.target.value)}
                    placeholder="Título"
                    className="rounded-xl border bg-white p-3"
                  />

                  <textarea
                    value={contenidoRegistro}
                    onChange={(e) => setContenidoRegistro(e.target.value)}
                    placeholder="Escribí la información..."
                    rows={6}
                    className="rounded-xl border bg-white p-3"
                  />

                  <button
                    onClick={crearRegistro}
                    disabled={
                      guardandoRegistro ||
                      !contenidoRegistro.trim()
                    }
                    className="rounded-xl bg-slate-900 p-3 font-semibold text-white disabled:opacity-50"
                  >
                    {guardandoRegistro
                      ? "Guardando..."
                      : "Guardar registro"}
                  </button>

                </div>

              </div>
            )}

            <div className="mt-5 space-y-3">

              {registros.map((registro) => (
                <div
                  key={registro.id}
                  className="rounded-xl border border-slate-400 bg-slate-100 p-4"
                >

                  <div className="flex gap-3">

                    <NotebookPen
                      size={20}
                      className="mt-1 text-sky-700"
                    />

                    <div className="flex-1">

                      <div className="flex justify-between gap-3">

                        <div>

                          <p className="text-xs font-semibold uppercase text-sky-700">
                            {registro.tipo || "Registro"}
                          </p>

                          {registro.titulo && (
                            <h3 className="mt-1 font-semibold">
                              {registro.titulo}
                            </h3>
                          )}

                        </div>

                        <span className="text-xs text-slate-600">
                          {formatearFechaHora(registro.created_at)}
                        </span>

                      </div>

                      {registro.contenido && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-900">
                          {registro.contenido}
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              ))}

              {registros.length === 0 && (
                <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-600">
                  Todavía no hay registros.
                </div>
              )}

            </div>

          </section>
        )}

        {tab === "Documentos" && (
          <DocumentosPanel
            dependenciaId={dependencia.id}
          />
        )}

      </div>
    </main>
  );
}

function Dato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border bg-slate-100 px-5 py-3">
      <p className="text-xs text-slate-600">
        {titulo}
      </p>

      <p className="text-xl font-semibold">
        {valor}
      </p>
    </div>
  );
}

function Tarjeta({
  titulo,
  valor,
  texto,
  onClick,
}: {
  titulo: string;
  valor: number;
  texto: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-400 bg-white p-5">

      <h2 className="font-semibold">
        {titulo}
      </h2>

      <p className="mt-4 text-3xl font-semibold">
        {valor}
      </p>

      <p className="text-sm text-slate-600">
        {texto}
      </p>

      <button
        onClick={onClick}
        className="mt-5 text-sm text-sky-700"
      >
        Ver {titulo.toLowerCase()} →
      </button>

    </div>
  );
}





