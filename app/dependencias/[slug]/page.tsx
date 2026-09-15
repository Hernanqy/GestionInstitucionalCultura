"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import DocumentosPanel from "@/components/dependencias/DocumentosPanel";

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  responsable: string | null;
};

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  tipo_contratacion: string | null;
  horas: string | null;
  telefono: string | null;
  email: string | null;
  observaciones: string | null;
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
  persona_id: string | null;
  created_at: string;
};

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
  created_at: string;
};

type Tab = "Resumen" | "Personal" | "Agenda" | "Pendientes" | "Documentos" | "Registros";

type AgendaForm = {
  id: string | null;
  nombre: string;
  fecha: string;
  hora: string;
  lugar: string;
  descripcion: string;
  responsable: string;
};

type PersonaForm = {
  id: string | null;
  nombre: string;
  apellido: string;
  cargo: string;
  horas: string;
  tipo_contratacion: string;
  telefono: string;
  email: string;
  observaciones: string;
};

type PendienteForm = {
  id: string | null;
  titulo: string;
  descripcion: string;
  prioridad: string;
  fecha_limite: string;
  persona_id: string;
  completado: boolean;
};

type RegistroForm = {
  id: string | null;
  tipo: string;
  titulo: string;
  contenido: string;
};

const agendaVacia: AgendaForm = {
  id: null,
  nombre: "",
  fecha: "",
  hora: "",
  lugar: "",
  descripcion: "",
  responsable: "",
};

const personaVacia: PersonaForm = {
  id: null,
  nombre: "",
  apellido: "",
  cargo: "",
  horas: "",
  tipo_contratacion: "",
  telefono: "",
  email: "",
  observaciones: "",
};

const pendienteVacio: PendienteForm = {
  id: null,
  titulo: "",
  descripcion: "",
  prioridad: "normal",
  fecha_limite: "",
  persona_id: "",
  completado: false,
};

const registroVacio: RegistroForm = {
  id: null,
  tipo: "Reunión",
  titulo: "",
  contenido: "",
};

function slug(texto: string) {
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
    month: "short",
    year: "numeric",
  });
}

function fechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DependenciaDetallePage() {
  const params = useParams();
  const slugActual = String(params.slug || "");
  const supabase = useMemo(() => createClient(), []);

  const [dependencia, setDependencia] = useState<Dependencia | null>(null);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [tab, setTab] = useState<Tab>("Resumen");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [buscarPersona, setBuscarPersona] = useState("");
  const [menuCarga, setMenuCarga] = useState(false);

  const [agendaForm, setAgendaForm] = useState<AgendaForm>(agendaVacia);
  const agendaTituloRef = useRef<HTMLInputElement>(null);
  const [personaForm, setPersonaForm] = useState<PersonaForm>(personaVacia);
  const [pendienteForm, setPendienteForm] = useState<PendienteForm>(pendienteVacio);
  const [registroForm, setRegistroForm] = useState<RegistroForm>(registroVacio);

  useEffect(() => {
    async function iniciar() {
      setCargando(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: deps, error } = await supabase
        .from("dependencias")
        .select("id,nombre,area,responsable,slug")
        .eq("activa", true);

      if (error) {
        console.error(error);
        setCargando(false);
        return;
      }

      const encontrada = (deps || []).find(
        (item) => item.slug === slugActual || slug(item.nombre) === slugActual
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

    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugActual]);

  async function cargarContenido(dependenciaId: string) {
    const [p, e, pen, reg] = await Promise.all([
      supabase
        .from("personas")
        .select("id,nombre,apellido,cargo,tipo_contratacion,horas,telefono,email,observaciones")
        .eq("dependencia_id", dependenciaId)
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("eventos")
        .select("id,nombre,descripcion,fecha,hora,lugar,responsable,estado")
        .eq("dependencia_id", dependenciaId)
        .order("fecha", { ascending: true, nullsFirst: false }),
      supabase
        .from("pendientes")
        .select("id,titulo,descripcion,prioridad,fecha_limite,completado,persona_id,created_at")
        .eq("dependencia_id", dependenciaId)
        .order("completado", { ascending: true })
        .order("fecha_limite", { ascending: true, nullsFirst: false }),
      supabase
        .from("registros")
        .select("id,titulo,contenido,tipo,created_at")
        .eq("dependencia_id", dependenciaId)
        .order("created_at", { ascending: false }),
    ]);

    if (p.error) console.error(p.error);
    if (e.error) console.error(e.error);
    if (pen.error) console.error(pen.error);
    if (reg.error) console.error(reg.error);

    setPersonal(p.data || []);
    setEventos(e.data || []);
    setPendientes(pen.data || []);
    setRegistros(reg.data || []);
  }

  function abrirTab(nueva: Tab) {
    setTab(nueva);
    setMenuCarga(false);
    setMensaje("");
  }

  function nuevaAgenda() {
    setAgendaForm(agendaVacia);
    abrirTab("Agenda");
    setMensaje("Nueva nota de agenda lista para cargar.");

    window.requestAnimationFrame(() => {
      agendaTituloRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      agendaTituloRef.current?.focus();
    });
  }

  function nuevaPersona() {
    setPersonaForm(personaVacia);
    abrirTab("Personal");
  }

  function nuevoPendiente() {
    setPendienteForm(pendienteVacio);
    abrirTab("Pendientes");
  }

  function nuevoRegistro() {
    setRegistroForm(registroVacio);
    abrirTab("Registros");
  }

  async function guardarAgenda() {
    if (!dependencia || !agendaForm.nombre.trim()) {
      setMensaje("Escribí un título para la agenda.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const payload = {
      nombre: agendaForm.nombre.trim(),
      fecha: agendaForm.fecha || null,
      hora: agendaForm.hora || null,
      lugar: agendaForm.lugar.trim() || null,
      descripcion: agendaForm.descripcion.trim() || null,
      responsable: agendaForm.responsable.trim() || null,
      dependencia_id: dependencia.id,
      estado: "pendiente",
      fuente: "dependencia_agenda",
    };

    const respuesta = agendaForm.id
      ? await supabase.from("eventos").update(payload).eq("id", agendaForm.id)
      : await supabase.from("eventos").insert(payload);

    if (respuesta.error) {
      console.error(respuesta.error);
      setMensaje("No se pudo guardar la agenda.");
    } else {
      await cargarContenido(dependencia.id);
      setAgendaForm(agendaVacia);
      setMensaje("Agenda guardada. También queda disponible en la Agenda general.");
    }

    setGuardando(false);
  }

  async function borrarAgenda(id: string, titulo: string) {
    if (!dependencia || !window.confirm(`¿Eliminar "${titulo}" de la agenda?`)) return;
    const { error } = await supabase.from("eventos").delete().eq("id", id);
    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar la agenda.");
      return;
    }
    setAgendaForm(agendaVacia);
    await cargarContenido(dependencia.id);
  }

  async function guardarPersona() {
    if (!dependencia || !personaForm.nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const payload = {
      nombre: personaForm.nombre.trim(),
      apellido: personaForm.apellido.trim() || null,
      cargo: personaForm.cargo.trim() || null,
      horas: personaForm.horas.trim() || null,
      tipo_contratacion: personaForm.tipo_contratacion.trim() || null,
      telefono: personaForm.telefono.trim() || null,
      email: personaForm.email.trim() || null,
      observaciones: personaForm.observaciones.trim() || null,
      dependencia_id: dependencia.id,
      area: dependencia.area,
      activo: true,
      fuente: "dependencia",
    };

    const respuesta = personaForm.id
      ? await supabase.from("personas").update(payload).eq("id", personaForm.id)
      : await supabase.from("personas").insert(payload);

    if (respuesta.error) {
      console.error(respuesta.error);
      setMensaje("No se pudo guardar la persona.");
    } else {
      await cargarContenido(dependencia.id);
      setPersonaForm(personaVacia);
      setMensaje("Personal guardado. También aparece en Personal general.");
    }

    setGuardando(false);
  }

  async function borrarPersona(id: string, nombre: string) {
    if (!dependencia || !window.confirm(`¿Quitar a ${nombre} de Personal?`)) return;

    // Baja lógica: preserva historial y relaciones, pero deja de verse en Personal activo.
    const { error } = await supabase
      .from("personas")
      .update({ activo: false })
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo quitar la persona.");
      return;
    }

    setPersonaForm(personaVacia);
    await cargarContenido(dependencia.id);
  }

  async function guardarPendiente() {
    if (!dependencia || !pendienteForm.titulo.trim()) {
      setMensaje("El título del pendiente es obligatorio.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const payload = {
      titulo: pendienteForm.titulo.trim(),
      descripcion: pendienteForm.descripcion.trim() || null,
      prioridad: pendienteForm.prioridad || "normal",
      fecha_limite: pendienteForm.fecha_limite || null,
      persona_id: pendienteForm.persona_id || null,
      completado: pendienteForm.completado,
      dependencia_id: dependencia.id,
    };

    const respuesta = pendienteForm.id
      ? await supabase.from("pendientes").update(payload).eq("id", pendienteForm.id)
      : await supabase.from("pendientes").insert(payload);

    if (respuesta.error) {
      console.error(respuesta.error);
      setMensaje("No se pudo guardar el pendiente.");
    } else {
      await cargarContenido(dependencia.id);
      setPendienteForm(pendienteVacio);
      setMensaje("Pendiente guardado. También aparece en TODO y Pendientes generales.");
    }

    setGuardando(false);
  }

  async function completarPendiente(item: Pendiente) {
    if (!dependencia) return;
    const { error } = await supabase
      .from("pendientes")
      .update({ completado: !item.completado })
      .eq("id", item.id);

    if (!error) await cargarContenido(dependencia.id);
  }

  async function borrarPendiente(id: string, titulo: string) {
    if (!dependencia || !window.confirm(`¿Eliminar el pendiente "${titulo}"?`)) return;
    const { error } = await supabase.from("pendientes").delete().eq("id", id);
    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar el pendiente.");
      return;
    }
    setPendienteForm(pendienteVacio);
    await cargarContenido(dependencia.id);
  }

  async function guardarRegistro() {
    if (!dependencia || !registroForm.titulo.trim()) {
      setMensaje("El título del registro es obligatorio.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const payload = {
      titulo: registroForm.titulo.trim(),
      contenido: registroForm.contenido.trim() || null,
      tipo: registroForm.tipo || "Nota",
      dependencia_id: dependencia.id,
    };

    const respuesta = registroForm.id
      ? await supabase.from("registros").update(payload).eq("id", registroForm.id)
      : await supabase.from("registros").insert(payload);

    if (respuesta.error) {
      console.error(respuesta.error);
      setMensaje("No se pudo guardar el registro.");
    } else {
      await cargarContenido(dependencia.id);
      setRegistroForm(registroVacio);
      setMensaje("Registro guardado dentro del espacio.");
    }

    setGuardando(false);
  }

  async function borrarRegistro(id: string, titulo: string) {
    if (!dependencia || !window.confirm(`¿Eliminar el registro "${titulo}"?`)) return;
    const { error } = await supabase.from("registros").delete().eq("id", id);
    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar el registro.");
      return;
    }
    setRegistroForm(registroVacio);
    await cargarContenido(dependencia.id);
  }

  const personalFiltrado = useMemo(() => {
    const q = buscarPersona.toLowerCase().trim();
    if (!q) return personal;
    return personal.filter((p) =>
      [p.nombre, p.apellido, p.cargo, p.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [personal, buscarPersona]);

  const pendientesActivos = pendientes.filter((p) => !p.completado);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
        <Loader2 className="animate-spin text-[#0f4777]" size={28} />
      </main>
    );
  }

  if (!dependencia) {
    return (
      <main className="min-h-screen bg-[#edf4f8] p-8 text-[#102b43]">
        <p className="font-bold">Dependencia no encontrada.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-[#102b43] lg:pb-8">
      <div className="mx-auto max-w-[1550px] px-3 py-5 md:px-6 lg:px-8">
        <a href="/dependencias" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          <ArrowLeft size={17} /> Dependencias
        </a>

        <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,43,70,0.05)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Building2 size={27} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{dependencia.nombre}</h1>
                <p className="mt-1 font-medium text-slate-600">{dependencia.area || "Sin área"}</p>
                {dependencia.responsable && (
                  <p className="mt-1 text-sm text-slate-500">Responsable: {dependencia.responsable}</p>
                )}
              </div>
            </div>

            <div className="relative flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuCarga((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f4777] px-4 py-3 text-sm font-bold text-white shadow-sm"
              >
                <Plus size={18} /> Cargar información
              </button>

              {menuCarga && (
                <div className="absolute right-0 top-14 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <QuickAction texto="Agenda" onClick={nuevaAgenda} />
                  <QuickAction texto="Personal" onClick={nuevaPersona} />
                  <QuickAction texto="Pendiente" onClick={nuevoPendiente} />
                  <QuickAction texto="Registro / nota" onClick={nuevoRegistro} />
                  <QuickAction texto="Documento" onClick={() => abrirTab("Documentos")} />
                </div>
              )}

              <Counter texto="Personal" valor={personal.length} />
              <Counter texto="Eventos" valor={eventos.length} />
              <Counter texto="Pendientes" valor={pendientesActivos.length} />
              <Counter texto="Registros" valor={registros.length} />
            </div>
          </div>
        </section>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {([
            ["Resumen", null],
            ["Personal", personal.length],
            ["Agenda", eventos.length],
            ["Pendientes", pendientesActivos.length],
            ["Documentos", null],
            ["Registros", registros.length],
          ] as [Tab, number | null][]).map(([nombre, cantidad]) => (
            <button
              key={nombre}
              onClick={() => abrirTab(nombre)}
              className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                tab === nombre
                  ? "border-[#0f4777] bg-[#0f4777] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {nombre}{cantidad !== null ? ` (${cantidad})` : ""}
            </button>
          ))}
        </div>

        {mensaje && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-900">
            <span>{mensaje}</span>
            <button onClick={() => setMensaje("")} className="text-cyan-700"><X size={17} /></button>
          </div>
        )}

        {tab === "Resumen" && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Building2 size={21} /></div>
                <div>
                  <h2 className="text-lg font-extrabold">Tu espacio de trabajo</h2>
                  <p className="text-sm text-slate-500">Gestioná toda la información de {dependencia.nombre} desde un mismo lugar.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ResumenCard icono={CalendarDays} titulo="Agenda del espacio" texto="Cargá la agenda mensual y cada actividad queda visible dentro del espacio y en Agenda general." boton="Ir a Agenda" onClick={() => abrirTab("Agenda")} />
                <ResumenCard icono={Users} titulo="Personal del espacio" texto="El personal que agregues aquí también aparece en la sección general de Personal." boton="Ir a Personal" onClick={() => abrirTab("Personal")} />
                <ResumenCard icono={ClipboardList} titulo="Pendientes del espacio" texto="Las tareas creadas aquí también aparecen en TODO y en Pendientes generales." boton="Ir a Pendientes" onClick={() => abrirTab("Pendientes")} />
                <ResumenCard icono={FileText} titulo="Registros y notas" texto="Guardá reuniones, observaciones y seguimientos vinculados al espacio." boton="Ir a Registros" onClick={() => abrirTab("Registros")} />
              </div>
            </div>

            <aside className="rounded-[22px] border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <h2 className="font-extrabold">Cómo funciona</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <Paso n="1" titulo="Cargá dentro del espacio" texto="Agenda, personal, pendientes, documentos o registros." />
                <Paso n="2" titulo="Queda guardado aquí" texto="Al volver a esta dependencia vas a ver todo lo que cargaste." />
                <Paso n="3" titulo="Editá o borrá desde la misma pestaña" texto="No necesitás salir del entorno del espacio." />
                <Paso n="4" titulo="Se refleja en vistas generales" texto="Personal, Agenda, TODO, Pendientes o Registros según corresponda." />
              </div>
            </aside>
          </section>
        )}

        {tab === "Agenda" && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Panel titulo="Agenda del espacio" subtitulo="Todo lo cargado aquí queda escrito en esta dependencia y también puede verse en Agenda general." icono={CalendarDays} accion="Nueva nota de agenda" onAccion={nuevaAgenda}>
              <div className="space-y-3">
                {eventos.length ? eventos.map((evento) => (
                  <div key={evento.id} className="rounded-2xl border border-emerald-300 bg-emerald-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-extrabold">{evento.nombre}</p>
                        <p className="mt-1 text-sm text-slate-500">{fechaCorta(evento.fecha)}{evento.hora ? ` · ${evento.hora.slice(0,5)} hs` : ""}{evento.lugar ? ` · ${evento.lugar}` : ""}</p>
                        {evento.descripcion && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{evento.descripcion}</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <MiniButton icono={Pencil} texto="Editar" onClick={() => setAgendaForm({ id: evento.id, nombre: evento.nombre, fecha: evento.fecha || "", hora: evento.hora?.slice(0,5) || "", lugar: evento.lugar || "", descripcion: evento.descripcion || "", responsable: evento.responsable || "" })} />
                        <MiniButton danger icono={Trash2} texto="Eliminar" onClick={() => borrarAgenda(evento.id, evento.nombre)} />
                      </div>
                    </div>
                  </div>
                )) : <Empty texto="Todavía no hay agenda cargada para este espacio." />}
              </div>
            </Panel>

            <Editor titulo={agendaForm.id ? "Editar nota de agenda" : "Nueva nota de agenda"}>
              <Campo label="Título *"><input ref={agendaTituloRef} value={agendaForm.nombre} onChange={(e) => setAgendaForm({ ...agendaForm, nombre: e.target.value })} className="inputGI" placeholder="Ej. Reunión con coordinador / Taller / Actividad" /></Campo>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Fecha"><input type="date" value={agendaForm.fecha} onChange={(e) => setAgendaForm({ ...agendaForm, fecha: e.target.value })} className="inputGI" /></Campo>
                <Campo label="Hora"><input type="time" value={agendaForm.hora} onChange={(e) => setAgendaForm({ ...agendaForm, hora: e.target.value })} className="inputGI" /></Campo>
              </div>
              <Campo label="Lugar"><input value={agendaForm.lugar} onChange={(e) => setAgendaForm({ ...agendaForm, lugar: e.target.value })} className="inputGI" placeholder="Lugar o sala" /></Campo>
              <Campo label="Detalle / observaciones"><textarea rows={5} value={agendaForm.descripcion} onChange={(e) => setAgendaForm({ ...agendaForm, descripcion: e.target.value })} className="inputGI" placeholder="Escribí la información de la agenda como una nota..." /></Campo>
              <Campo label="Responsable"><input value={agendaForm.responsable} onChange={(e) => setAgendaForm({ ...agendaForm, responsable: e.target.value })} className="inputGI" /></Campo>
              <EditorActions guardando={guardando} onGuardar={guardarAgenda} onNuevo={nuevaAgenda} eliminar={agendaForm.id ? () => borrarAgenda(agendaForm.id!, agendaForm.nombre) : undefined} />
            </Editor>
          </section>
        )}

        {tab === "Personal" && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Panel titulo="Personal del espacio" subtitulo="El personal cargado aquí también aparece en Personal general." icono={Users} accion="Agregar persona" onAccion={nuevaPersona}>
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                <Search size={18} className="text-slate-400" />
                <input value={buscarPersona} onChange={(e) => setBuscarPersona(e.target.value)} placeholder="Buscar por nombre, cargo o email..." className="w-full bg-transparent text-sm outline-none" />
              </div>
              <div className="space-y-2">
                {personalFiltrado.length ? personalFiltrado.map((persona) => (
                  <div key={persona.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-100 text-cyan-800"><UserRound size={19} /></div>
                      <div className="min-w-0">
                        <p className="font-bold">{persona.nombre}{persona.apellido ? ` ${persona.apellido}` : ""}</p>
                        <p className="truncate text-xs text-slate-500">{[persona.cargo, persona.horas, persona.tipo_contratacion].filter(Boolean).join(" · ") || "Sin datos de cargo"}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <MiniButton icono={Pencil} texto="Editar" onClick={() => setPersonaForm({ id: persona.id, nombre: persona.nombre, apellido: persona.apellido || "", cargo: persona.cargo || "", horas: persona.horas || "", tipo_contratacion: persona.tipo_contratacion || "", telefono: persona.telefono || "", email: persona.email || "", observaciones: persona.observaciones || "" })} />
                      <MiniButton danger icono={Trash2} texto="Eliminar" onClick={() => borrarPersona(persona.id, `${persona.nombre}${persona.apellido ? ` ${persona.apellido}` : ""}`)} />
                    </div>
                  </div>
                )) : <Empty texto="No hay personal cargado en esta dependencia." />}
              </div>
            </Panel>

            <Editor titulo={personaForm.id ? "Editar ficha de personal" : "Agregar persona"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Nombre *"><input value={personaForm.nombre} onChange={(e) => setPersonaForm({ ...personaForm, nombre: e.target.value })} className="inputGI" /></Campo>
                <Campo label="Apellido"><input value={personaForm.apellido} onChange={(e) => setPersonaForm({ ...personaForm, apellido: e.target.value })} className="inputGI" /></Campo>
              </div>
              <Campo label="Cargo"><input value={personaForm.cargo} onChange={(e) => setPersonaForm({ ...personaForm, cargo: e.target.value })} className="inputGI" /></Campo>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Horas"><input value={personaForm.horas} onChange={(e) => setPersonaForm({ ...personaForm, horas: e.target.value })} className="inputGI" placeholder="Ej. 40 hs" /></Campo>
                <Campo label="Tipo de contratación"><input value={personaForm.tipo_contratacion} onChange={(e) => setPersonaForm({ ...personaForm, tipo_contratacion: e.target.value })} className="inputGI" /></Campo>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Teléfono"><input value={personaForm.telefono} onChange={(e) => setPersonaForm({ ...personaForm, telefono: e.target.value })} className="inputGI" /></Campo>
                <Campo label="Email"><input type="email" value={personaForm.email} onChange={(e) => setPersonaForm({ ...personaForm, email: e.target.value })} className="inputGI" /></Campo>
              </div>
              <Campo label="Observaciones"><textarea rows={4} value={personaForm.observaciones} onChange={(e) => setPersonaForm({ ...personaForm, observaciones: e.target.value })} className="inputGI" /></Campo>
              <EditorActions guardando={guardando} onGuardar={guardarPersona} onNuevo={nuevaPersona} eliminar={personaForm.id ? () => borrarPersona(personaForm.id!, `${personaForm.nombre} ${personaForm.apellido}`.trim()) : undefined} />
            </Editor>
          </section>
        )}

        {tab === "Pendientes" && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Panel titulo="Pendientes del espacio" subtitulo="Los pendientes creados aquí también aparecen en TODO y Pendientes generales." icono={ClipboardList} accion="Nuevo pendiente" onAccion={nuevoPendiente}>
              <div className="space-y-3">
                {pendientes.length ? pendientes.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${item.completado ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-extrabold ${item.completado ? "line-through text-slate-500" : ""}`}>{item.titulo}</p>
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold uppercase text-slate-500">{item.prioridad || "normal"}</span>
                        </div>
                        {item.descripcion && <p className="mt-2 text-sm text-slate-600">{item.descripcion}</p>}
                        <p className="mt-2 text-xs font-semibold text-slate-500">{item.fecha_limite ? `Fecha límite: ${fechaCorta(item.fecha_limite)}` : "Sin fecha límite"}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <MiniButton icono={CheckCircle2} texto={item.completado ? "Reabrir" : "Completar"} onClick={() => completarPendiente(item)} />
                        <MiniButton icono={Pencil} texto="Editar" onClick={() => setPendienteForm({ id: item.id, titulo: item.titulo, descripcion: item.descripcion || "", prioridad: item.prioridad || "normal", fecha_limite: item.fecha_limite || "", persona_id: item.persona_id || "", completado: item.completado })} />
                        <MiniButton danger icono={Trash2} texto="Eliminar" onClick={() => borrarPendiente(item.id, item.titulo)} />
                      </div>
                    </div>
                  </div>
                )) : <Empty texto="No hay pendientes cargados en este espacio." />}
              </div>
            </Panel>

            <Editor titulo={pendienteForm.id ? "Editar pendiente" : "Nuevo pendiente"}>
              <Campo label="Título *"><input value={pendienteForm.titulo} onChange={(e) => setPendienteForm({ ...pendienteForm, titulo: e.target.value })} className="inputGI" /></Campo>
              <Campo label="Descripción"><textarea rows={4} value={pendienteForm.descripcion} onChange={(e) => setPendienteForm({ ...pendienteForm, descripcion: e.target.value })} className="inputGI" /></Campo>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Prioridad"><select value={pendienteForm.prioridad} onChange={(e) => setPendienteForm({ ...pendienteForm, prioridad: e.target.value })} className="inputGI"><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></Campo>
                <Campo label="Fecha límite"><input type="date" value={pendienteForm.fecha_limite} onChange={(e) => setPendienteForm({ ...pendienteForm, fecha_limite: e.target.value })} className="inputGI" /></Campo>
              </div>
              <Campo label="Responsable"><select value={pendienteForm.persona_id} onChange={(e) => setPendienteForm({ ...pendienteForm, persona_id: e.target.value })} className="inputGI"><option value="">Sin asignar</option>{personal.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.apellido ? ` ${p.apellido}` : ""}</option>)}</select></Campo>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold"><input type="checkbox" checked={pendienteForm.completado} onChange={(e) => setPendienteForm({ ...pendienteForm, completado: e.target.checked })} /> Marcar como realizado</label>
              <EditorActions guardando={guardando} onGuardar={guardarPendiente} onNuevo={nuevoPendiente} eliminar={pendienteForm.id ? () => borrarPendiente(pendienteForm.id!, pendienteForm.titulo) : undefined} />
            </Editor>
          </section>
        )}

        {tab === "Documentos" && <DocumentosPanel dependenciaId={dependencia.id} />}

        {tab === "Registros" && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Panel titulo="Registros del espacio" subtitulo="Reuniones, observaciones y seguimientos quedan guardados dentro de esta dependencia." icono={FileText} accion="Nuevo registro" onAccion={nuevoRegistro}>
              <div className="space-y-3">
                {registros.length ? registros.map((registro) => (
                  <div key={registro.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-bold text-cyan-800">{registro.tipo || "Nota"}</span>
                        <p className="mt-2 font-extrabold">{registro.titulo || "Sin título"}</p>
                        <p className="mt-1 text-xs text-slate-500">{fechaHora(registro.created_at)}</p>
                        {registro.contenido && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{registro.contenido}</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <MiniButton icono={Pencil} texto="Editar" onClick={() => setRegistroForm({ id: registro.id, tipo: registro.tipo || "Nota", titulo: registro.titulo || "", contenido: registro.contenido || "" })} />
                        <MiniButton danger icono={Trash2} texto="Eliminar" onClick={() => borrarRegistro(registro.id, registro.titulo || "Sin título")} />
                      </div>
                    </div>
                  </div>
                )) : <Empty texto="No hay registros cargados en este espacio." />}
              </div>
            </Panel>

            <Editor titulo={registroForm.id ? "Editar registro" : "Nuevo registro"}>
              <Campo label="Tipo"><select value={registroForm.tipo} onChange={(e) => setRegistroForm({ ...registroForm, tipo: e.target.value })} className="inputGI"><option>Reunión</option><option>Observación</option><option>Seguimiento</option><option>Nota</option><option>Acuerdo</option></select></Campo>
              <Campo label="Título *"><input value={registroForm.titulo} onChange={(e) => setRegistroForm({ ...registroForm, titulo: e.target.value })} className="inputGI" /></Campo>
              <Campo label="Contenido / observaciones"><textarea rows={8} value={registroForm.contenido} onChange={(e) => setRegistroForm({ ...registroForm, contenido: e.target.value })} className="inputGI" placeholder="Dejá asentada la reunión, acuerdos, observaciones o seguimiento..." /></Campo>
              <EditorActions guardando={guardando} onGuardar={guardarRegistro} onNuevo={nuevoRegistro} eliminar={registroForm.id ? () => borrarRegistro(registroForm.id!, registroForm.titulo) : undefined} />
            </Editor>
          </section>
        )}
      </div>

      <style jsx global>{`
        .inputGI {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.75rem;
          background: white;
          padding: 0.72rem 0.85rem;
          font-size: 0.875rem;
          color: rgb(15 43 67);
          outline: none;
        }
        .inputGI:focus { border-color: rgb(8 145 178); box-shadow: 0 0 0 3px rgba(8,145,178,.08); }
      `}</style>
    </main>
  );
}

function Counter({ texto, valor }: { texto: string; valor: number }) {
  return <div className="min-w-[92px] rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5"><p className="text-xs text-slate-500">{texto}</p><p className="mt-0.5 text-xl font-extrabold">{valor}</p></div>;
}

function QuickAction({ texto, onClick }: { texto: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100">+ {texto}</button>;
}

function Paso({ n, titulo, texto }: { n: string; titulo: string; texto: string }) {
  return <div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 font-extrabold text-blue-700">{n}</div><div><p className="font-bold text-[#102b43]">{titulo}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{texto}</p></div></div>;
}

function ResumenCard({ icono: Icon, titulo, texto, boton, onClick }: { icono: ElementType; titulo: string; texto: string; boton: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-cyan-700 shadow-sm"><Icon size={22} /></div><h3 className="mt-4 font-extrabold">{titulo}</h3><p className="mt-2 min-h-12 text-sm leading-5 text-slate-600">{texto}</p><span className="mt-4 inline-flex text-sm font-bold text-cyan-700">{boton} →</span></button>;
}

function Panel({ titulo, subtitulo, icono: Icon, accion, onAccion, children }: { titulo: string; subtitulo: string; icono: ElementType; accion: string; onAccion: () => void; children: ReactNode }) {
  return <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><Icon size={22} className="mt-0.5 shrink-0 text-cyan-700" /><div><h2 className="text-lg font-extrabold">{titulo}</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitulo}</p></div></div><button type="button" onClick={onAccion} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f4777] px-4 py-2.5 text-sm font-bold text-white"><Plus size={17} /> {accion}</button></div><div className="mt-5">{children}</div></section>;
}

function Editor({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <aside className="h-fit rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Pencil size={18} /></div><h2 className="text-lg font-extrabold">{titulo}</h2></div><div className="mt-5 space-y-4">{children}</div></aside>;
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>{children}</label>;
}

function EditorActions({ guardando, onGuardar, onNuevo, eliminar }: { guardando: boolean; onGuardar: () => void; onNuevo: () => void; eliminar?: () => void }) {
  return <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4"><button type="button" disabled={guardando} onClick={onGuardar} className="inline-flex items-center gap-2 rounded-xl bg-[#0f4777] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{guardando ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} Guardar</button><button type="button" onClick={onNuevo} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-600"><Plus size={17} /> Nuevo</button>{eliminar && <button type="button" onClick={eliminar} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700"><Trash2 size={17} /> Eliminar</button>}</div>;
}

function MiniButton({ icono: Icon, texto, onClick, danger = false }: { icono: ElementType; texto: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${danger ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"}`}><Icon size={15} /> {texto}</button>;
}

function Empty({ texto }: { texto: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">{texto}</div>;
}
