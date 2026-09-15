"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Dependencia = { id: string; nombre: string };

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  fecha_hasta: string | null;
  fecha_texto: string | null;
  hora: string | null;
  lugar: string | null;
  localidad: string | null;
  dependencia_id: string | null;
  responsable: string | null;
  expediente: string | null;
  descripcion: string | null;
  costo: number | null;
  estado: string | null;
  observaciones: string | null;
  dependencias: { id: string; nombre: string } | null;
};

type Item = {
  id: string;
  evento_id: string;
  orden: number;
  necesidad: string;
  requerido: boolean | null;
  fecha_texto: string | null;
  cantidad: string | null;
  proveedor: string | null;
  costo: number | null;
  solicitud: string | null;
  caracteristicas: string | null;
  encargado: string | null;
  observaciones: string | null;
  completado: boolean;
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
  created_at: string;
};

type Reunion = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
};

function fechaBonita(fecha: string | null, texto?: string | null) {
  if (texto) return texto;
  if (!fecha) return "Sin fecha";
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function moneda(valor: number | null) {
  if (valor === null) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function EventoSeguimientoPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const supabase = useMemo(() => createClient(), []);

  const [evento, setEvento] = useState<Evento | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [cargando, setCargando] = useState(true);

  const [editando, setEditando] = useState(false);
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    fecha: "",
    fecha_hasta: "",
    hora: "",
    lugar: "",
    localidad: "",
    dependencia_id: "",
    responsable: "",
    expediente: "",
    descripcion: "",
    observaciones: "",
    estado: "pendiente",
    costo: "",
  });

  const [nuevaNecesidad, setNuevaNecesidad] = useState("");
  const [nuevoPendiente, setNuevoPendiente] = useState("");
  const [detallePendiente, setDetallePendiente] = useState("");
  const [fechaPendiente, setFechaPendiente] = useState("");
  const [prioridadPendiente, setPrioridadPendiente] = useState("normal");
  const [tituloNota, setTituloNota] = useState("");
  const [textoNota, setTextoNota] = useState("");
  const [reunionNombre, setReunionNombre] = useState("");
  const [reunionFecha, setReunionFecha] = useState("");
  const [reunionHora, setReunionHora] = useState("");
  const [reunionLugar, setReunionLugar] = useState("");

  async function cargar() {
    setCargando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const [
      eventoResult,
      itemsResult,
      pendientesResult,
      registrosResult,
      reunionesResult,
      dependenciasResult,
    ] = await Promise.all([
      supabase
        .from("eventos")
        .select(`
          id,nombre,fecha,fecha_hasta,fecha_texto,hora,lugar,localidad,
          dependencia_id,responsable,expediente,descripcion,costo,estado,observaciones,
          dependencias(id,nombre)
        `)
        .eq("id", id)
        .single(),

      supabase
        .from("evento_items")
        .select("*")
        .eq("evento_id", id)
        .order("orden", { ascending: true }),

      supabase
        .from("pendientes")
        .select("id,titulo,descripcion,prioridad,fecha_limite,completado")
        .eq("evento_id", id)
        .order("completado", { ascending: true })
        .order("fecha_limite", { ascending: true, nullsFirst: false }),

      supabase
        .from("registros")
        .select("id,titulo,contenido,created_at")
        .eq("evento_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("eventos")
        .select("id,nombre,fecha,hora,lugar")
        .eq("evento_padre_id", id)
        .order("fecha", { ascending: true, nullsFirst: false }),

      supabase
        .from("dependencias")
        .select("id,nombre")
        .eq("activa", true)
        .order("nombre"),
    ]);

    if (eventoResult.error || !eventoResult.data) {
      console.error(eventoResult.error);
      setEvento(null);
      setCargando(false);
      return;
    }

    const e = eventoResult.data as unknown as Evento;
    setEvento(e);
    setItems((itemsResult.data || []) as Item[]);
    setPendientes((pendientesResult.data || []) as Pendiente[]);
    setRegistros((registrosResult.data || []) as Registro[]);
    setReuniones((reunionesResult.data || []) as Reunion[]);
    setDependencias((dependenciasResult.data || []) as Dependencia[]);
    setForm({
      nombre: e.nombre || "",
      fecha: e.fecha || "",
      fecha_hasta: e.fecha_hasta || "",
      hora: e.hora ? e.hora.slice(0, 5) : "",
      lugar: e.lugar || "",
      localidad: e.localidad || "",
      dependencia_id: e.dependencia_id || "",
      responsable: e.responsable || "",
      expediente: e.expediente || "",
      descripcion: e.descripcion || "",
      observaciones: e.observaciones || "",
      estado: e.estado || "pendiente",
      costo: e.costo === null ? "" : String(e.costo),
    });

    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const resumen = useMemo(() => {
    const total = items.length;
    const completados = items.filter((i) => i.completado).length;
    const porcentaje = total ? Math.round((completados / total) * 100) : 0;
    const sumaItems = items.reduce((acc, item) => acc + (Number(item.costo) || 0), 0);
    const pendientesActivos = pendientes.filter((p) => !p.completado).length;
    return { total, completados, porcentaje, sumaItems, pendientesActivos };
  }, [items, pendientes]);

  async function guardarEvento() {
    if (!evento || !form.nombre.trim()) return;
    setGuardandoEvento(true);

    const costo = form.costo.trim() ? Number(form.costo.replace(",", ".")) : null;

    const { error } = await supabase
      .from("eventos")
      .update({
        nombre: form.nombre.trim(),
        fecha: form.fecha || null,
        fecha_hasta: form.fecha_hasta || null,
        hora: form.hora ? `${form.hora}:00` : null,
        lugar: form.lugar.trim() || null,
        localidad: form.localidad.trim() || null,
        dependencia_id: form.dependencia_id || null,
        responsable: form.responsable.trim() || null,
        expediente: form.expediente.trim() || null,
        descripcion: form.descripcion.trim() || null,
        observaciones: form.observaciones.trim() || null,
        estado: form.estado,
        costo: Number.isFinite(costo as number) ? costo : null,
      })
      .eq("id", evento.id);

    setGuardandoEvento(false);

    if (error) {
      console.error(error);
      alert("No se pudo guardar el evento.");
      return;
    }

    setEditando(false);
    await cargar();
  }

  async function eliminarEvento() {
    if (!evento) return;
    const confirmar = window.confirm(
      `¿Eliminar "${evento.nombre}"? Se eliminarán también su checklist, reuniones vinculadas y pendientes.`
    );
    if (!confirmar) return;

    await supabase.from("registros").delete().eq("evento_id", evento.id);
    const { error } = await supabase.from("eventos").delete().eq("id", evento.id);

    if (error) {
      console.error(error);
      alert("No se pudo eliminar el evento.");
      return;
    }

    router.push("/eventos");
    router.refresh();
  }

  async function agregarNecesidad() {
    if (!nuevaNecesidad.trim()) return;
    const orden = items.length ? Math.max(...items.map((i) => i.orden || 0)) + 1 : 1;

    const { error } = await supabase.from("evento_items").insert({
      evento_id: id,
      orden,
      necesidad: nuevaNecesidad.trim(),
      requerido: null,
      completado: false,
      fuente: "gestion_eventos",
    });

    if (!error) {
      setNuevaNecesidad("");
      await cargar();
    }
  }

  async function agregarPendiente() {
    if (!evento || !nuevoPendiente.trim()) return;

    const { error } = await supabase.from("pendientes").insert({
      titulo: nuevoPendiente.trim(),
      descripcion: detallePendiente.trim() || null,
      prioridad: prioridadPendiente,
      fecha_limite: fechaPendiente || null,
      completado: false,
      evento_id: evento.id,
      dependencia_id: evento.dependencia_id || null,
    });

    if (!error) {
      setNuevoPendiente("");
      setDetallePendiente("");
      setFechaPendiente("");
      setPrioridadPendiente("normal");
      await cargar();
    }
  }

  async function completarPendiente(pendiente: Pendiente) {
    const { error } = await supabase
      .from("pendientes")
      .update({ completado: !pendiente.completado })
      .eq("id", pendiente.id);

    if (!error) await cargar();
  }

  async function borrarPendiente(pendienteId: string) {
    if (!window.confirm("¿Eliminar este pendiente?")) return;
    const { error } = await supabase.from("pendientes").delete().eq("id", pendienteId);
    if (!error) await cargar();
  }

  async function agregarNota() {
    if (!evento || (!tituloNota.trim() && !textoNota.trim())) return;

    const { error } = await supabase.from("registros").insert({
      titulo: tituloNota.trim() || "Observación",
      contenido: textoNota.trim() || null,
      tipo: "Evento",
      evento_id: evento.id,
      dependencia_id: evento.dependencia_id || null,
    });

    if (!error) {
      setTituloNota("");
      setTextoNota("");
      await cargar();
    }
  }

  async function agregarReunion() {
    if (!evento || !reunionNombre.trim()) return;

    const { error } = await supabase.from("eventos").insert({
      nombre: reunionNombre.trim(),
      fecha: reunionFecha || null,
      hora: reunionHora ? `${reunionHora}:00` : null,
      lugar: reunionLugar.trim() || null,
      dependencia_id: evento.dependencia_id || null,
      responsable: evento.responsable || null,
      descripcion: `Reunión vinculada al evento ${evento.nombre}`,
      estado: "pendiente",
      fuente: "evento_reunion",
      es_evento_gestion: false,
      evento_padre_id: evento.id,
    });

    if (!error) {
      setReunionNombre("");
      setReunionFecha("");
      setReunionHora("");
      setReunionLugar("");
      await cargar();
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={22} className="animate-spin" />
          Cargando ficha del evento...
        </div>
      </main>
    );
  }

  if (!evento) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 text-red-700">
          Evento no encontrado.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-28 text-[#102b43] lg:pb-12">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#102b43]"
          >
            <ArrowLeft size={17} />
            Eventos
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              {editando ? <X size={17} /> : <Pencil size={17} />}
              {editando ? "Cerrar edición" : "Editar"}
            </button>

            <button
              type="button"
              onClick={eliminarEvento}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700"
            >
              <Trash2 size={17} />
              Eliminar
            </button>
          </div>
        </div>

        <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold uppercase text-cyan-800">
                  {evento.estado || "pendiente"}
                </span>
                {evento.expediente && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Exp. {evento.expediente}
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
                {evento.nombre}
              </h1>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={16} />
                  {fechaBonita(evento.fecha, evento.fecha_texto)}
                  {evento.fecha_hasta ? ` al ${fechaBonita(evento.fecha_hasta)}` : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  {[evento.lugar, evento.localidad].filter(Boolean).join(" · ") || "Lugar sin cargar"}
                </span>
              </div>

              {evento.descripcion && (
                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {evento.descripcion}
                </p>
              )}
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-2">
              <Kpi titulo="Checklist" valor={`${resumen.completados}/${resumen.total}`} />
              <Kpi titulo="Progreso" valor={`${resumen.porcentaje}%`} />
              <Kpi titulo="Pendientes" valor={String(resumen.pendientesActivos)} />
              <Kpi titulo="Ítems" valor={moneda(resumen.sumaItems)} chico />
            </div>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#1685a7]"
              style={{ width: `${resumen.porcentaje}%` }}
            />
          </div>
        </section>

        {editando && (
          <section className="mt-5 rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold">Editar datos generales</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Campo label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <Campo label="Responsable" value={form.responsable} onChange={(v) => setForm({ ...form, responsable: v })} />
              <Campo label="Fecha" type="date" value={form.fecha} onChange={(v) => setForm({ ...form, fecha: v })} />
              <Campo label="Fecha hasta" type="date" value={form.fecha_hasta} onChange={(v) => setForm({ ...form, fecha_hasta: v })} />
              <Campo label="Hora" type="time" value={form.hora} onChange={(v) => setForm({ ...form, hora: v })} />
              <Campo label="Lugar" value={form.lugar} onChange={(v) => setForm({ ...form, lugar: v })} />
              <Campo label="Localidad" value={form.localidad} onChange={(v) => setForm({ ...form, localidad: v })} />
              <Campo label="Expediente" value={form.expediente} onChange={(v) => setForm({ ...form, expediente: v })} />
              <Campo label="Costo total" type="number" value={form.costo} onChange={(v) => setForm({ ...form, costo: v })} />

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Dependencia relacionada</label>
                <select
                  value={form.dependencia_id}
                  onChange={(e) => setForm({ ...form, dependencia_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                >
                  <option value="">Sin dependencia específica</option>
                  {dependencias.filter((d) => d.nombre !== "Eventos").map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="preparacion">En preparación</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <Area label="Descripción" value={form.descripcion} onChange={(v) => setForm({ ...form, descripcion: v })} />
              <Area label="Observaciones generales" value={form.observaciones} onChange={(v) => setForm({ ...form, observaciones: v })} />
            </div>

            <button
              type="button"
              onClick={guardarEvento}
              disabled={guardandoEvento}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#124775] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {guardandoEvento ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              Guardar cambios
            </button>
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold">Checklist y necesidades</h2>
              <p className="text-sm text-slate-500">
                Datos del Excel y nuevas necesidades del evento.
              </p>
            </div>
            <span className="text-sm font-bold text-slate-600">
              Total de ítems: {moneda(resumen.sumaItems)}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={nuevaNecesidad}
              onChange={(e) => setNuevaNecesidad(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregarNecesidad()}
              placeholder="Agregar necesidad..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-600"
            />
            <button
              type="button"
              onClick={agregarNecesidad}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <ItemSeguimiento
                key={item.id}
                item={item}
                supabase={supabase}
                onSaved={cargar}
              />
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList size={19} className="text-cyan-700" />
              <h2 className="text-lg font-extrabold">Pendientes del evento</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              También aparecen en Pendientes y TODO.
            </p>

            <div className="mt-4 space-y-2">
              <input
                value={nuevoPendiente}
                onChange={(e) => setNuevoPendiente(e.target.value)}
                placeholder="Nuevo pendiente..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
              <textarea
                rows={2}
                value={detallePendiente}
                onChange={(e) => setDetallePendiente(e.target.value)}
                placeholder="Detalle u observación..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fechaPendiente}
                  onChange={(e) => setFechaPendiente(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
                <select
                  value={prioridadPendiente}
                  onChange={(e) => setPrioridadPendiente(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <button
                type="button"
                onClick={agregarPendiente}
                className="inline-flex items-center gap-2 rounded-xl bg-[#124775] px-4 py-2.5 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Agregar pendiente
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {pendientes.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    p.completado ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => completarPendiente(p)}
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                      p.completado
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-400 bg-white"
                    }`}
                  >
                    {p.completado && <Check size={14} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${p.completado ? "line-through text-slate-500" : "text-slate-800"}`}>
                      {p.titulo}
                    </p>
                    {p.descripcion && <p className="mt-1 text-xs text-slate-500">{p.descripcion}</p>}
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      {p.fecha_limite ? fechaBonita(p.fecha_limite) : "Sin fecha"} · {p.prioridad || "normal"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => borrarPendiente(p.id)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="Eliminar pendiente"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays size={19} className="text-cyan-700" />
              <h2 className="text-lg font-extrabold">Reuniones vinculadas</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              También aparecen en Agenda y TODO.
            </p>

            <div className="mt-4 space-y-2">
              <input
                value={reunionNombre}
                onChange={(e) => setReunionNombre(e.target.value)}
                placeholder="Nombre de la reunión..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={reunionFecha}
                  onChange={(e) => setReunionFecha(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
                <input
                  type="time"
                  value={reunionHora}
                  onChange={(e) => setReunionHora(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                />
              </div>
              <input
                value={reunionLugar}
                onChange={(e) => setReunionLugar(e.target.value)}
                placeholder="Lugar..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={agregarReunion}
                className="inline-flex items-center gap-2 rounded-xl bg-[#124775] px-4 py-2.5 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Agregar reunión
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {reuniones.map((r) => (
                <Link
                  key={r.id}
                  href={`/agenda/${r.id}`}
                  className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-sky-50"
                >
                  <p className="text-sm font-bold text-slate-800">{r.nombre}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {fechaBonita(r.fecha)}
                    {r.hora ? ` · ${r.hora.slice(0, 5)} hs` : ""}
                    {r.lugar ? ` · ${r.lugar}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText size={19} className="text-cyan-700" />
            <h2 className="text-lg font-extrabold">Observaciones e historial</h2>
          </div>

          <div className="mt-4 grid gap-2">
            <input
              value={tituloNota}
              onChange={(e) => setTituloNota(e.target.value)}
              placeholder="Título de la nota..."
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
            <textarea
              rows={3}
              value={textoNota}
              onChange={(e) => setTextoNota(e.target.value)}
              placeholder="Observación, acuerdo, novedad..."
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={agregarNota}
              className="w-fit inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              <Plus size={16} />
              Agregar registro
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {registros.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-slate-800">{r.titulo || "Observación"}</p>
                  <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                    {new Date(r.created_at).toLocaleString("es-AR")}
                  </span>
                </div>
                {r.contenido && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{r.contenido}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({
  titulo,
  valor,
  chico = false,
}: {
  titulo: string;
  valor: string;
  chico?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-1 font-extrabold text-[#102b43] ${chico ? "text-sm" : "text-xl"}`}>{valor}</p>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600"
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600"
      />
    </div>
  );
}

function ItemSeguimiento({
  item,
  supabase,
  onSaved,
}: {
  item: Item;
  supabase: ReturnType<typeof createClient>;
  onSaved: () => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    necesidad: item.necesidad || "",
    requerido: item.requerido === true ? "si" : item.requerido === false ? "no" : "definir",
    fecha_texto: item.fecha_texto || "",
    cantidad: item.cantidad || "",
    proveedor: item.proveedor || "",
    costo: item.costo === null ? "" : String(item.costo),
    solicitud: item.solicitud || "",
    caracteristicas: item.caracteristicas || "",
    encargado: item.encargado || "",
    observaciones: item.observaciones || "",
  });

  useEffect(() => {
    setForm({
      necesidad: item.necesidad || "",
      requerido: item.requerido === true ? "si" : item.requerido === false ? "no" : "definir",
      fecha_texto: item.fecha_texto || "",
      cantidad: item.cantidad || "",
      proveedor: item.proveedor || "",
      costo: item.costo === null ? "" : String(item.costo),
      solicitud: item.solicitud || "",
      caracteristicas: item.caracteristicas || "",
      encargado: item.encargado || "",
      observaciones: item.observaciones || "",
    });
  }, [item]);

  async function toggle() {
    const { error } = await supabase
      .from("evento_items")
      .update({ completado: !item.completado })
      .eq("id", item.id);
    if (!error) await onSaved();
  }

  async function guardar() {
    setGuardando(true);
    const costo = form.costo.trim() ? Number(form.costo.replace(",", ".")) : null;

    const { error } = await supabase
      .from("evento_items")
      .update({
        necesidad: form.necesidad.trim(),
        requerido:
          form.requerido === "si" ? true : form.requerido === "no" ? false : null,
        fecha_texto: form.fecha_texto.trim() || null,
        cantidad: form.cantidad.trim() || null,
        proveedor: form.proveedor.trim() || null,
        costo: Number.isFinite(costo as number) ? costo : null,
        solicitud: form.solicitud.trim() || null,
        caracteristicas: form.caracteristicas.trim() || null,
        encargado: form.encargado.trim() || null,
        observaciones: form.observaciones.trim() || null,
      })
      .eq("id", item.id);

    setGuardando(false);
    if (!error) {
      setEditando(false);
      await onSaved();
    }
  }

  async function borrar() {
    if (!window.confirm(`¿Eliminar "${item.necesidad}" de la checklist?`)) return;
    const { error } = await supabase.from("evento_items").delete().eq("id", item.id);
    if (!error) await onSaved();
  }

  const badge =
    item.requerido === true
      ? "Sí"
      : item.requerido === false
      ? "No"
      : "Por definir";

  return (
    <div className={`rounded-xl border p-4 ${item.completado ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggle}
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
            item.completado
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-400 bg-white text-transparent"
          }`}
          aria-label="Marcar completado"
        >
          <Check size={15} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-extrabold ${item.completado ? "text-slate-500 line-through" : "text-slate-800"}`}>
              {item.necesidad}
            </h3>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-extrabold uppercase text-slate-500">
              {badge}
            </span>
          </div>

          {!editando && (
            <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
              {item.cantidad && <p><strong>Cantidad:</strong> {item.cantidad}</p>}
              {item.proveedor && <p><strong>Proveedor:</strong> {item.proveedor}</p>}
              {item.costo !== null && <p><strong>Costo:</strong> {moneda(item.costo)}</p>}
              {item.solicitud && <p><strong>Solicitud:</strong> {item.solicitud}</p>}
              {item.encargado && <p><strong>Encargado:</strong> {item.encargado}</p>}
              {item.fecha_texto && <p><strong>Fecha:</strong> {item.fecha_texto}</p>}
              {item.caracteristicas && <p className="sm:col-span-2"><strong>Características:</strong> {item.caracteristicas}</p>}
              {item.observaciones && <p className="sm:col-span-2"><strong>Observaciones:</strong> {item.observaciones}</p>}
            </div>
          )}

          {editando && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Campo label="Necesidad" value={form.necesidad} onChange={(v) => setForm({ ...form, necesidad: v })} />
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">¿Se necesita?</label>
                <select
                  value={form.requerido}
                  onChange={(e) => setForm({ ...form, requerido: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
                >
                  <option value="definir">Por definir</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <Campo label="Fecha / referencia" value={form.fecha_texto} onChange={(v) => setForm({ ...form, fecha_texto: v })} />
              <Campo label="Cantidad" value={form.cantidad} onChange={(v) => setForm({ ...form, cantidad: v })} />
              <Campo label="Proveedor" value={form.proveedor} onChange={(v) => setForm({ ...form, proveedor: v })} />
              <Campo label="Costo" type="number" value={form.costo} onChange={(v) => setForm({ ...form, costo: v })} />
              <Campo label="N° solicitud" value={form.solicitud} onChange={(v) => setForm({ ...form, solicitud: v })} />
              <Campo label="Encargado" value={form.encargado} onChange={(v) => setForm({ ...form, encargado: v })} />
              <Area label="Características" value={form.caracteristicas} onChange={(v) => setForm({ ...form, caracteristicas: v })} />
              <Area label="Observaciones" value={form.observaciones} onChange={(v) => setForm({ ...form, observaciones: v })} />

              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="w-fit inline-flex items-center gap-2 rounded-xl bg-[#124775] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar ítem
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#124775]"
            aria-label="Editar ítem"
          >
            {editando ? <X size={15} /> : <Pencil size={15} />}
          </button>
          <button
            type="button"
            onClick={borrar}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600"
            aria-label="Eliminar ítem"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}