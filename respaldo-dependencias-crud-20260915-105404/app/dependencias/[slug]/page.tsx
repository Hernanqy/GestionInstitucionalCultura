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
  Plus,
  Save,
  MapPin,
  CheckCircle2,
} from "lucide-react";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  tipo_contratacion: string | null;
  horas: string | null;
  legajo: string | null;
};

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  responsable: string | null;
};

type Evento = {
  id: string;
  nombre: string;
  descripcion: string | null;
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
  created_at: string;
};

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
  created_at: string;
};

type TipoCarga = "registro" | "reunion" | "pendiente";

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

function fechaCorta(valor: string | null) {
  if (!valor) return "Sin fecha";

  return new Date(`${valor}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fechaHoraRegistro(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DependenciaDetallePage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const supabase = useMemo(() => createClient(), []);

  const [dependencia, setDependencia] = useState<Dependencia | null>(null);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const [tab, setTab] = useState("Resumen");
  const [buscar, setBuscar] = useState("");
  const [cargando, setCargando] = useState(true);

  const [mostrarCarga, setMostrarCarga] = useState(false);
  const [tipoCarga, setTipoCarga] = useState<TipoCarga>("registro");
  const [tituloCarga, setTituloCarga] = useState("");
  const [detalleCarga, setDetalleCarga] = useState("");
  const [fechaCarga, setFechaCarga] = useState("");
  const [horaCarga, setHoraCarga] = useState("");
  const [lugarCarga, setLugarCarga] = useState("");
  const [prioridadCarga, setPrioridadCarga] = useState("normal");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

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

      const { data: deps } = await supabase
        .from("dependencias")
        .select("id,nombre,area,responsable")
        .eq("activa", true);

      const encontrada = (deps || []).find(
        (item) => crearSlug(item.nombre) === slug
      );

      if (!encontrada) {
        setDependencia(null);
        setCargando(false);
        return;
      }

      setDependencia(encontrada);
      await cargarContenido(encontrada.id);
      setCargando(false);
    }

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, supabase]);

  async function cargarContenido(dependenciaId: string) {
    const [
      personasResult,
      eventosResult,
      pendientesResult,
      registrosResult,
    ] = await Promise.all([
      supabase
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
        .eq("dependencia_id", dependenciaId)
        .eq("activo", true)
        .order("nombre"),

      supabase
        .from("eventos")
        .select(`
          id,
          nombre,
          descripcion,
          fecha,
          hora,
          lugar,
          responsable,
          estado
        `)
        .eq("dependencia_id", dependenciaId)
        .order("fecha", {
          ascending: false,
          nullsFirst: false,
        }),

      supabase
        .from("pendientes")
        .select(`
          id,
          titulo,
          descripcion,
          prioridad,
          fecha_limite,
          completado,
          created_at
        `)
        .eq("dependencia_id", dependenciaId)
        .order("completado", { ascending: true })
        .order("fecha_limite", {
          ascending: true,
          nullsFirst: false,
        }),

      supabase
        .from("registros")
        .select(`
          id,
          titulo,
          contenido,
          tipo,
          created_at
        `)
        .eq("dependencia_id", dependenciaId)
        .order("created_at", { ascending: false }),
    ]);

    setPersonal(personasResult.data || []);
    setEventos(eventosResult.data || []);
    setPendientes(pendientesResult.data || []);
    setRegistros(registrosResult.data || []);
  }

  async function guardarInformacion() {
    if (!dependencia) return;

    if (!tituloCarga.trim()) {
      setMensaje("Escribí un título.");
      return;
    }

    if (tipoCarga === "reunion" && !fechaCarga) {
      setMensaje("Para una reunión cargá la fecha.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    let errorGuardar: { message?: string } | null = null;

    if (tipoCarga === "registro") {
      const respuesta = await supabase.from("registros").insert({
        titulo: tituloCarga.trim(),
        contenido: detalleCarga.trim() || null,
        tipo: "Nota",
        dependencia_id: dependencia.id,
      });

      errorGuardar = respuesta.error;
    }

    if (tipoCarga === "reunion") {
      const respuesta = await supabase.from("eventos").insert({
        nombre: tituloCarga.trim(),
        descripcion: detalleCarga.trim() || null,
        fecha: fechaCarga,
        hora: horaCarga || null,
        lugar: lugarCarga.trim() || null,
        responsable: dependencia.responsable || null,
        estado: "pendiente",
        fuente: "dependencia",
        dependencia_id: dependencia.id,
      });

      errorGuardar = respuesta.error;
    }

    if (tipoCarga === "pendiente") {
      const respuesta = await supabase.from("pendientes").insert({
        titulo: tituloCarga.trim(),
        descripcion: detalleCarga.trim() || null,
        prioridad: prioridadCarga,
        fecha_limite: fechaCarga || null,
        completado: false,
        dependencia_id: dependencia.id,
      });

      errorGuardar = respuesta.error;
    }

    if (errorGuardar) {
      console.error(errorGuardar);
      setMensaje("No se pudo guardar la información.");
      setGuardando(false);
      return;
    }

    setTituloCarga("");
    setDetalleCarga("");
    setFechaCarga("");
    setHoraCarga("");
    setLugarCarga("");
    setPrioridadCarga("normal");

    await cargarContenido(dependencia.id);

    setMensaje("Información guardada correctamente.");
    setGuardando(false);
  }

  async function completarPendiente(id: string) {
    if (!dependencia) return;

    const { error } = await supabase
      .from("pendientes")
      .update({ completado: true })
      .eq("id", id);

    if (!error) {
      await cargarContenido(dependencia.id);
    }
  }

  const personalFiltrado = useMemo(() => {
    const texto = buscar.toLowerCase().trim();

    return personal.filter((persona) => {
      const contenido = [
        persona.nombre,
        persona.apellido,
        persona.cargo,
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

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-300">
        <Loader2 size={25} className="animate-spin text-black" />
      </main>
    );
  }

  if (!dependencia) {
    return (
      <main className="min-h-screen bg-slate-300 p-8 text-black">
        <p>Dependencia no encontrada.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-300 pb-24 text-black lg:pb-8">
      <div className="mx-auto max-w-[1500px] px-5 py-6">
        <a
          href="/dependencias"
          className="mb-5 inline-flex items-center gap-2 font-medium text-black"
        >
          <ArrowLeft size={18} />
          Dependencias
        </a>

        <section className="rounded-2xl border border-slate-900 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Building2 size={27} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-black">
                  {dependencia.nombre}
                </h1>

                <p className="mt-2 font-medium text-black">
                  {dependencia.area || "Sin área asignada"}
                </p>

                {dependencia.responsable && (
                  <p className="mt-1 text-sm text-black">
                    Responsable:{" "}
                    <strong>{dependencia.responsable}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarCarga((valor) => !valor)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f4777] px-4 py-3 text-sm font-bold text-white shadow-sm"
              >
                <Plus size={18} />
                Cargar información
              </button>

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Personal</p>
                <p className="text-xl font-bold text-black">
                  {personal.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Eventos</p>
                <p className="text-xl font-bold text-black">
                  {eventos.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Pendientes</p>
                <p className="text-xl font-bold text-black">
                  {pendientesActivos.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Registros</p>
                <p className="text-xl font-bold text-black">
                  {registros.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {mostrarCarga && (
          <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-black">
                Cargar en {dependencia.nombre}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Elegí qué tipo de información estás registrando.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["registro", "Nota / registro"],
                ["reunion", "Reunión"],
                ["pendiente", "Pendiente"],
              ].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => {
                    setTipoCarga(valor as TipoCarga);
                    setMensaje("");
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                    tipoCarga === valor
                      ? "border-[#0f4777] bg-[#0f4777] text-white"
                      : "border-slate-300 bg-slate-50 text-slate-700"
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Título
                </label>
                <input
                  value={tituloCarga}
                  onChange={(e) => setTituloCarga(e.target.value)}
                  placeholder={
                    tipoCarga === "reunion"
                      ? "Ej. Reunión con equipo educativo"
                      : tipoCarga === "pendiente"
                      ? "Ej. Pedir presupuesto de cartelería"
                      : "Ej. Novedad del espacio"
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Información
                </label>
                <textarea
                  value={detalleCarga}
                  onChange={(e) => setDetalleCarga(e.target.value)}
                  rows={4}
                  placeholder="Detalle, acuerdos, observaciones..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              {(tipoCarga === "reunion" || tipoCarga === "pendiente") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      {tipoCarga === "pendiente"
                        ? "Fecha límite"
                        : "Fecha"}
                    </label>
                    <input
                      type="date"
                      value={fechaCarga}
                      onChange={(e) => setFechaCarga(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    />
                  </div>

                  {tipoCarga === "reunion" && (
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={horaCarga}
                        onChange={(e) => setHoraCarga(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                      />
                    </div>
                  )}

                  {tipoCarga === "pendiente" && (
                    <div>
                      <label className="mb-1 block text-sm font-semibold">
                        Prioridad
                      </label>
                      <select
                        value={prioridadCarga}
                        onChange={(e) => setPrioridadCarga(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                      >
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                        <option value="baja">Baja</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {tipoCarga === "reunion" && (
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Lugar
                  </label>
                  <input
                    value={lugarCarga}
                    onChange={(e) => setLugarCarga(e.target.value)}
                    placeholder="Ej. Museo, oficina, SUM..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  />
                </div>
              )}

              {mensaje && (
                <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm">
                  {mensaje}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={guardarInformacion}
                  disabled={guardando}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {guardando ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Guardar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarCarga(false);
                    setMensaje("");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((item) => {
            const cantidad =
              item === "Personal"
                ? personal.length
                : item === "Agenda"
                ? eventos.length
                : item === "Pendientes"
                ? pendientesActivos.length
                : item === "Registros"
                ? registros.length
                : null;

            return (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-xl border border-slate-900 px-4 py-2.5 font-medium ${
                  tab === item
                    ? "bg-slate-900 text-white"
                    : "bg-white text-black"
                }`}
              >
                {item}
                {cantidad !== null ? ` (${cantidad})` : ""}
              </button>
            );
          })}
        </div>

        {tab === "Resumen" && (
          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <button
              onClick={() => setTab("Personal")}
              className="rounded-2xl border border-slate-900 bg-white p-5 text-left"
            >
              <Users size={21} className="text-cyan-700" />
              <h2 className="mt-3 font-bold text-black">
                Personal
              </h2>
              <p className="mt-2 text-3xl font-bold text-black">
                {personal.length}
              </p>
            </button>

            <button
              onClick={() => setTab("Agenda")}
              className="rounded-2xl border border-slate-900 bg-white p-5 text-left"
            >
              <CalendarDays size={21} className="text-cyan-700" />
              <h2 className="mt-3 font-bold text-black">
                Agenda
              </h2>
              <p className="mt-2 text-3xl font-bold text-black">
                {eventos.length}
              </p>
            </button>

            <button
              onClick={() => setTab("Pendientes")}
              className="rounded-2xl border border-slate-900 bg-white p-5 text-left"
            >
              <ClipboardList size={21} className="text-cyan-700" />
              <h2 className="mt-3 font-bold text-black">
                Pendientes
              </h2>
              <p className="mt-2 text-3xl font-bold text-black">
                {pendientesActivos.length}
              </p>
            </button>
          </section>
        )}

        {tab === "Personal" && (
          <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-black">
                  Personal
                </h2>
                <p className="text-sm text-black">
                  {personal.length} personas
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-900 bg-white px-4 py-3">
                <Search size={18} />
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-transparent text-black outline-none placeholder:text-black md:w-56"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {personalFiltrado.map((persona) => (
                <a
                  key={persona.id}
                  href={`/personal/${persona.id}`}
                  className="relative z-10 block cursor-pointer rounded-xl border border-slate-900 bg-slate-100 p-4 text-black transition hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-md"
                  title={`Abrir ficha de ${persona.nombre}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
                      <UserRound size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-black">
                        {persona.nombre}
                        {persona.apellido ? ` ${persona.apellido}` : ""}
                      </h3>

                      {persona.cargo && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-black">
                          <BriefcaseBusiness size={15} />
                          <span>{persona.cargo}</span>
                        </div>
                      )}

                      {persona.horas && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-black">
                          <Clock3 size={15} />
                          <span>{persona.horas}</span>
                        </div>
                      )}

                      {persona.tipo_contratacion && (
                        <p className="mt-2 text-xs font-semibold uppercase text-black">
                          {persona.tipo_contratacion}
                        </p>
                      )}

                      {persona.legajo && (
                        <p className="mt-2 text-xs font-medium text-black">
                          Legajo {persona.legajo}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-xl font-bold text-sky-700">
                      ›
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {tab === "Agenda" && (
          <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-5">
            <div className="flex items-center gap-3">
              <CalendarDays size={21} className="text-cyan-700" />
              <div>
                <h2 className="font-bold text-black">
                  Agenda del espacio
                </h2>
                <p className="text-sm text-slate-600">
                  También aparece en la Agenda general y en TODO.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {eventos.length > 0 ? (
                eventos.map((evento) => (
                  <a
                    key={evento.id}
                    href={`/agenda/${evento.id}`}
                    className="block rounded-xl border border-slate-300 bg-slate-50 p-4 transition hover:bg-sky-50"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-bold text-black">
                          {evento.nombre}
                        </h3>

                        {evento.descripcion && (
                          <p className="mt-1 text-sm text-slate-600">
                            {evento.descripcion}
                          </p>
                        )}

                        {evento.lugar && (
                          <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                            <MapPin size={14} />
                            {evento.lugar}
                          </p>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-600">
                        <p>{fechaCorta(evento.fecha)}</p>
                        {evento.hora && <p>{evento.hora.slice(0, 5)} hs</p>}
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <Vacio texto="No hay reuniones o eventos cargados para este espacio." />
              )}
            </div>
          </section>
        )}

        {tab === "Pendientes" && (
          <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-5">
            <div className="flex items-center gap-3">
              <ClipboardList size={21} className="text-cyan-700" />
              <div>
                <h2 className="font-bold text-black">
                  Pendientes del espacio
                </h2>
                <p className="text-sm text-slate-600">
                  También aparecen en Pendientes y en TODO.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {pendientes.length > 0 ? (
                pendientes.map((pendiente) => (
                  <div
                    key={pendiente.id}
                    className={`rounded-xl border p-4 ${
                      pendiente.completado
                        ? "border-slate-200 bg-slate-50 opacity-60"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-black">
                            {pendiente.titulo}
                          </h3>

                          {pendiente.prioridad && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase text-slate-600">
                              {pendiente.prioridad}
                            </span>
                          )}
                        </div>

                        {pendiente.descripcion && (
                          <p className="mt-1 text-sm text-slate-600">
                            {pendiente.descripcion}
                          </p>
                        )}

                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {pendiente.fecha_limite
                            ? `Fecha límite: ${fechaCorta(pendiente.fecha_limite)}`
                            : "Sin fecha límite"}
                        </p>
                      </div>

                      {!pendiente.completado && (
                        <button
                          type="button"
                          onClick={() => completarPendiente(pendiente.id)}
                          title="Marcar como realizado"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-300 bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <Vacio texto="No hay pendientes cargados para este espacio." />
              )}
            </div>
          </section>
        )}

        {tab === "Documentos" && (
          <SeccionVacia
            icono={FolderOpen}
            titulo="Documentos"
            texto="Los documentos vinculados al espacio seguirán gestionándose desde Documentos."
          />
        )}

        {tab === "Registros" && (
          <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-5">
            <div className="flex items-center gap-3">
              <FileText size={21} className="text-cyan-700" />
              <div>
                <h2 className="font-bold text-black">
                  Registros del espacio
                </h2>
                <p className="text-sm text-slate-600">
                  También aparecen en Registros generales.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {registros.length > 0 ? (
                registros.map((registro) => (
                  <div
                    key={registro.id}
                    className="rounded-xl border border-slate-300 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                          {registro.tipo || "Registro"}
                        </p>
                        <h3 className="mt-1 font-bold text-black">
                          {registro.titulo || "Sin título"}
                        </h3>

                        {registro.contenido && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                            {registro.contenido}
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 text-xs font-semibold text-slate-500">
                        {fechaHoraRegistro(registro.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <Vacio texto="No hay registros cargados para este espacio." />
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <p className="text-sm text-slate-600">{texto}</p>
    </div>
  );
}

function SeccionVacia({
  icono: Icon,
  titulo,
  texto,
}: {
  icono: React.ElementType;
  titulo: string;
  texto: string;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-6">
      <div className="flex items-center gap-3">
        <Icon size={21} className="text-cyan-700" />
        <h2 className="font-bold text-black">
          {titulo}
        </h2>
      </div>

      <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <p className="text-sm text-slate-600">
          {texto}
        </p>
      </div>
    </section>
  );
}
