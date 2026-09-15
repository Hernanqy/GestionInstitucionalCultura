"use client";

import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileDown,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  activa: boolean;
};

type Pendiente = {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: string | null;
  fecha_limite: string | null;
  completado: boolean;
  created_at: string;
  updated_at: string;
  dependencia_id: string | null;
  evento_id: string | null;
};

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  fecha_hasta: string | null;
  lugar: string | null;
  localidad: string | null;
  costo: number | string | null;
  estado: string | null;
  dependencia_id: string | null;
  created_at: string;
  updated_at: string;
  es_evento_gestion: boolean;
};

type EventoItem = {
  id: string;
  evento_id: string;
  necesidad: string;
  requerido: boolean | null;
  completado: boolean;
  costo: number | string | null;
  proveedor: string | null;
  encargado: string | null;
  solicitud: string | null;
  observaciones: string | null;
  updated_at: string;
};

type Registro = {
  id: string;
  titulo: string | null;
  tipo: string | null;
  dependencia_id: string | null;
  evento_id: string | null;
  created_at: string;
};

type Persona = {
  id: string;
  dependencia_id: string | null;
  activo: boolean;
  tipo_contratacion: string | null;
};

type Tab = "resumen" | "pendientes" | "eventos" | "dependencias" | "mensual";

type ActividadDependencia = {
  id: string;
  nombre: string;
  area: string | null;
  pendientes: number;
  eventos: number;
  reuniones: number;
  registros: number;
  total: number;
};

const HOY = new Date();

function fechaISO(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function inicioMes(fecha: Date) {
  return fechaISO(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
}

function finMes(fecha: Date) {
  return fechaISO(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0));
}

function haceDias(fecha: Date, dias: number) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() - dias);
  return fechaISO(copia);
}

function sumarDias(fechaISOBase: string, dias: number) {
  const fecha = new Date(`${fechaISOBase}T12:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return fechaISO(fecha);
}

function fechaDeTimestamp(valor: string) {
  return valor.slice(0, 10);
}

function enRango(valor: string | null | undefined, desde: string, hasta: string) {
  if (!valor) return false;
  const fecha = valor.length >= 10 ? valor.slice(0, 10) : valor;
  return fecha >= desde && fecha <= hasta;
}

function dinero(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function fechaHumana(valor: string | null) {
  if (!valor) return "Sin fecha";
  return new Date(`${valor}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function nombreMes(desde: string) {
  return new Date(`${desde}T12:00:00`).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function porcentaje(parte: number, total: number) {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

function prioridadOrden(prioridad: string | null) {
  const p = (prioridad || "").toLowerCase();
  if (p === "urgente") return 0;
  if (p === "alta") return 1;
  if (p === "normal" || p === "media") return 2;
  return 3;
}

export default function InformesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [desde, setDesde] = useState(inicioMes(HOY));
  const [hasta, setHasta] = useState(finMes(HOY));
  const [dependenciaFiltro, setDependenciaFiltro] = useState("todas");
  const [tab, setTab] = useState<Tab>("resumen");

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [items, setItems] = useState<EventoItem[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  async function cargarDatos(esActualizacion = false) {
    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const [
      dependenciasResult,
      pendientesResult,
      eventosResult,
      itemsResult,
      registrosResult,
      personasResult,
    ] = await Promise.all([
      supabase
        .from("dependencias")
        .select("id,nombre,area,activa")
        .eq("activa", true)
        .order("nombre"),

      supabase
        .from("pendientes")
        .select(
          "id,titulo,descripcion,prioridad,fecha_limite,completado,created_at,updated_at,dependencia_id,evento_id"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("eventos")
        .select(
          "id,nombre,fecha,fecha_hasta,lugar,localidad,costo,estado,dependencia_id,created_at,updated_at,es_evento_gestion"
        )
        .order("fecha", { ascending: false, nullsFirst: false }),

      supabase
        .from("evento_items")
        .select(
          "id,evento_id,necesidad,requerido,completado,costo,proveedor,encargado,solicitud,observaciones,updated_at"
        )
        .order("orden"),

      supabase
        .from("registros")
        .select("id,titulo,tipo,dependencia_id,evento_id,created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("personas")
        .select("id,dependencia_id,activo,tipo_contratacion")
        .eq("activo", true),
    ]);

    const errores = [
      dependenciasResult.error,
      pendientesResult.error,
      eventosResult.error,
      itemsResult.error,
      registrosResult.error,
      personasResult.error,
    ].filter(Boolean);

    if (errores.length) {
      console.error(errores);
      setError("No se pudieron cargar todos los datos del informe.");
    }

    setDependencias(dependenciasResult.data || []);
    setPendientes(pendientesResult.data || []);
    setEventos(eventosResult.data || []);
    setItems(itemsResult.data || []);
    setRegistros(registrosResult.data || []);
    setPersonas(personasResult.data || []);

    setCargando(false);
    setActualizando(false);
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dependenciaNombre = useMemo(() => {
    return new Map(dependencias.map((d) => [d.id, d.nombre]));
  }, [dependencias]);


  const aplicaDependencia = useCallback(
    (id: string | null) =>
      dependenciaFiltro === "todas" || id === dependenciaFiltro,
    [dependenciaFiltro]
  );

  const eventosGestionPeriodo = useMemo(
    () =>
      eventos.filter(
        (e) =>
          e.es_evento_gestion &&
          aplicaDependencia(e.dependencia_id) &&
          enRango(e.fecha, desde, hasta)
      ),
    [eventos, aplicaDependencia, desde, hasta]
  );

  const eventosGestionTodosFiltro = useMemo(
    () =>
      eventos.filter(
        (e) =>
          e.es_evento_gestion && aplicaDependencia(e.dependencia_id)
      ),
    [eventos, aplicaDependencia]
  );

  const reunionesPeriodo = useMemo(
    () =>
      eventos.filter(
        (e) =>
          !e.es_evento_gestion &&
          aplicaDependencia(e.dependencia_id) &&
          enRango(e.fecha, desde, hasta)
      ),
    [eventos, aplicaDependencia, desde, hasta]
  );

  const pendientesAbiertos = useMemo(
    () =>
      pendientes.filter(
        (p) => !p.completado && aplicaDependencia(p.dependencia_id)
      ),
    [pendientes, aplicaDependencia]
  );

  const pendientesCreadosPeriodo = useMemo(
    () =>
      pendientes.filter(
        (p) =>
          aplicaDependencia(p.dependencia_id) &&
          enRango(fechaDeTimestamp(p.created_at), desde, hasta)
      ),
    [pendientes, aplicaDependencia, desde, hasta]
  );

  const pendientesCompletadosPeriodo = useMemo(
    () =>
      pendientes.filter(
        (p) =>
          p.completado &&
          aplicaDependencia(p.dependencia_id) &&
          enRango(fechaDeTimestamp(p.updated_at), desde, hasta)
      ),
    [pendientes, aplicaDependencia, desde, hasta]
  );

  const vencidos = useMemo(
    () =>
      pendientesAbiertos.filter(
        (p) => p.fecha_limite && p.fecha_limite < fechaISO(HOY)
      ),
    [pendientesAbiertos]
  );

  const proximos7 = useMemo(() => {
    const hoy = fechaISO(HOY);
    const limite = sumarDias(hoy, 7);
    return pendientesAbiertos.filter(
      (p) =>
        p.fecha_limite &&
        p.fecha_limite >= hoy &&
        p.fecha_limite <= limite
    );
  }, [pendientesAbiertos]);

  const registrosPeriodo = useMemo(
    () =>
      registros.filter(
        (r) =>
          aplicaDependencia(r.dependencia_id) &&
          enRango(fechaDeTimestamp(r.created_at), desde, hasta)
      ),
    [registros, aplicaDependencia, desde, hasta]
  );

  const eventosGestionIds = useMemo(
    () => new Set(eventosGestionTodosFiltro.map((e) => e.id)),
    [eventosGestionTodosFiltro]
  );

  const itemsFiltro = useMemo(
    () => items.filter((i) => eventosGestionIds.has(i.evento_id)),
    [items, eventosGestionIds]
  );

  const itemsRequeridos = useMemo(
    () => itemsFiltro.filter((i) => i.requerido !== false),
    [itemsFiltro]
  );

  const itemsCompletados = useMemo(
    () => itemsRequeridos.filter((i) => i.completado),
    [itemsRequeridos]
  );


  const costoEventosPeriodo = useMemo(
    () =>
      eventosGestionPeriodo.reduce(
        (acc, evento) => acc + numero(evento.costo),
        0
      ),
    [eventosGestionPeriodo]
  );

  const costoEventosTotalFiltro = useMemo(
    () =>
      eventosGestionTodosFiltro.reduce(
        (acc, evento) => acc + numero(evento.costo),
        0
      ),
    [eventosGestionTodosFiltro]
  );

  const personalActivo = useMemo(
    () =>
      personas.filter(
        (p) =>
          dependenciaFiltro === "todas" ||
          p.dependencia_id === dependenciaFiltro
      ),
    [personas, dependenciaFiltro]
  );

  const actividadDependencias = useMemo<ActividadDependencia[]>(() => {
    return dependencias
      .filter(
        (d) =>
          dependenciaFiltro === "todas" ||
          d.id === dependenciaFiltro
      )
      .map((dep) => {
        const p = pendientes.filter(
          (item) =>
            item.dependencia_id === dep.id &&
            enRango(fechaDeTimestamp(item.updated_at), desde, hasta)
        ).length;

        const eg = eventos.filter(
          (item) =>
            item.dependencia_id === dep.id &&
            item.es_evento_gestion &&
            enRango(item.fecha, desde, hasta)
        ).length;

        const reu = eventos.filter(
          (item) =>
            item.dependencia_id === dep.id &&
            !item.es_evento_gestion &&
            enRango(item.fecha, desde, hasta)
        ).length;

        const reg = registros.filter(
          (item) =>
            item.dependencia_id === dep.id &&
            enRango(fechaDeTimestamp(item.created_at), desde, hasta)
        ).length;

        return {
          id: dep.id,
          nombre: dep.nombre,
          area: dep.area,
          pendientes: p,
          eventos: eg,
          reuniones: reu,
          registros: reg,
          total: p + eg + reu + reg,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [
    dependencias,
    dependenciaFiltro,
    pendientes,
    eventos,
    registros,
    desde,
    hasta,
  ]);

  const proveedores = useMemo(() => {
    const mapa = new Map<string, { cantidad: number; costo: number }>();

    itemsFiltro.forEach((item) => {
      const proveedor = item.proveedor?.trim();
      if (!proveedor) return;

      const actual = mapa.get(proveedor) || { cantidad: 0, costo: 0 };
      actual.cantidad += 1;
      actual.costo += numero(item.costo);
      mapa.set(proveedor, actual);
    });

    return Array.from(mapa.entries())
      .map(([nombre, datos]) => ({ nombre, ...datos }))
      .sort((a, b) => b.costo - a.costo || b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [itemsFiltro]);

  const eventosSeguimiento = useMemo(() => {
    return eventosGestionTodosFiltro
      .map((evento) => {
        const propios = items.filter((i) => i.evento_id === evento.id);
        const requeridos = propios.filter((i) => i.requerido !== false);
        const hechos = requeridos.filter((i) => i.completado);
        const faltantes = requeridos.filter((i) => !i.completado);

        return {
          ...evento,
          requeridos: requeridos.length,
          hechos: hechos.length,
          faltantes: faltantes.length,
          progreso: porcentaje(hechos.length, requeridos.length),
        };
      })
      .sort((a, b) => {
        if (!a.fecha && b.fecha) return -1;
        if (a.fecha && !b.fecha) return 1;
        return (b.fecha || "").localeCompare(a.fecha || "");
      });
  }, [eventosGestionTodosFiltro, items]);

  const situacionesAtencion = useMemo(() => {
    const resultado: {
      tipo: string;
      titulo: string;
      detalle: string;
      href: string;
      nivel: "alta" | "media";
    }[] = [];

    vencidos.slice(0, 6).forEach((p) => {
      resultado.push({
        tipo: "Pendiente vencido",
        titulo: p.titulo,
        detalle: `${fechaHumana(p.fecha_limite)} · ${
          dependenciaNombre.get(p.dependencia_id || "") || "General"
        }`,
        href: "/pendientes",
        nivel: "alta",
      });
    });

    proximos7.slice(0, 5).forEach((p) => {
      resultado.push({
        tipo: "Vence pronto",
        titulo: p.titulo,
        detalle: `${fechaHumana(p.fecha_limite)} · ${
          dependenciaNombre.get(p.dependencia_id || "") || "General"
        }`,
        href: "/pendientes",
        nivel: "media",
      });
    });

    const hoy = fechaISO(HOY);
    const en30 = sumarDias(hoy, 30);

    eventosSeguimiento
      .filter(
        (e) =>
          e.faltantes > 0 &&
          (!e.fecha || (e.fecha >= hoy && e.fecha <= en30))
      )
      .slice(0, 6)
      .forEach((e) => {
        resultado.push({
          tipo: "Evento",
          titulo: e.nombre,
          detalle: `${e.faltantes} ítems por resolver · ${
            e.fecha ? fechaHumana(e.fecha) : "sin fecha"
          }`,
          href: `/eventos/${e.id}`,
          nivel: e.fecha && e.fecha <= sumarDias(hoy, 7) ? "alta" : "media",
        });
      });

    return resultado.slice(0, 10);
  }, [
    vencidos,
    proximos7,
    dependenciaNombre,
    eventosSeguimiento,
  ]);

  function preset(valor: "mes" | "30" | "anio") {
    if (valor === "mes") {
      setDesde(inicioMes(HOY));
      setHasta(finMes(HOY));
    }

    if (valor === "30") {
      setDesde(haceDias(HOY, 29));
      setHasta(fechaISO(HOY));
    }

    if (valor === "anio") {
      setDesde(`${HOY.getFullYear()}-01-01`);
      setHasta(`${HOY.getFullYear()}-12-31`);
    }
  }

  function imprimir() {
    window.print();
  }

  function exportarCSV() {
    const filas = [
      ["Indicador", "Valor"],
      ["Período", `${desde} a ${hasta}`],
      ["Pendientes activos", String(pendientesAbiertos.length)],
      ["Pendientes creados en período", String(pendientesCreadosPeriodo.length)],
      [
        "Pendientes completados en período",
        String(pendientesCompletadosPeriodo.length),
      ],
      ["Pendientes vencidos", String(vencidos.length)],
      ["Eventos de gestión en período", String(eventosGestionPeriodo.length)],
      ["Reuniones/agenda en período", String(reunionesPeriodo.length)],
      ["Registros en período", String(registrosPeriodo.length)],
      ["Costo eventos en período", String(costoEventosPeriodo)],
      ["Personal activo", String(personalActivo.length)],
      [
        "Checklist completado",
        `${itemsCompletados.length}/${itemsRequeridos.length}`,
      ],
    ];

    const csv = filas
      .map((fila) =>
        fila
          .map((celda) => `"${String(celda).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-gi-${desde}-${hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
        <div className="flex items-center gap-3 text-[#102b43]">
          <Loader2 className="animate-spin" size={24} />
          <span className="font-semibold">Preparando informes...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-[#102b43] lg:pb-8">
      <style jsx global>{`
        @media print {
          aside,
          nav,
          .no-print {
            display: none !important;
          }

          body,
          main {
            background: white !important;
          }

          main {
            padding: 0 !important;
          }

          .print-area {
            max-width: none !important;
            padding: 0 !important;
          }

          .print-card {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="print-area mx-auto max-w-[1500px] px-5 py-7 md:px-7 lg:px-8">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f4777] text-white shadow-sm">
                <BarChart3 size={23} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                  Gestión Institucional
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                  Informes
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Indicadores automáticos construidos con la actividad real de GI.
              No necesitás cargar información nuevamente.
            </p>
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => cargarDatos(true)}
              disabled={actualizando}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={actualizando ? "animate-spin" : ""}
              />
              Actualizar
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm"
            >
              <FileDown size={17} />
              CSV
            </button>

            <button
              type="button"
              onClick={imprimir}
              className="inline-flex items-center gap-2 rounded-xl bg-[#102b43] px-4 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              <Printer size={17} />
              Imprimir / PDF
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="no-print mt-6 rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => preset("mes")}
                className="rounded-xl bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800"
              >
                Este mes
              </button>

              <button
                type="button"
                onClick={() => preset("30")}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
              >
                Últimos 30 días
              </button>

              <button
                type="button"
                onClick={() => preset("anio")}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
              >
                {HOY.getFullYear()} completo
              </button>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-500">
                Desde
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700"
                />
              </label>

              <label className="text-xs font-bold text-slate-500">
                Hasta
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700"
                />
              </label>

              <label className="text-xs font-bold text-slate-500">
                Dependencia
                <select
                  value={dependenciaFiltro}
                  onChange={(e) => setDependenciaFiltro(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700"
                >
                  <option value="todas">Todas las dependencias</option>
                  {dependencias.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metrica
            icono={ClipboardCheck}
            titulo="Pendientes activos"
            valor={pendientesAbiertos.length}
            detalle={`${vencidos.length} vencidos`}
          />
          <Metrica
            icono={CheckCircle2}
            titulo="Resueltos"
            valor={pendientesCompletadosPeriodo.length}
            detalle="en el período"
          />
          <Metrica
            icono={CalendarDays}
            titulo="Eventos"
            valor={eventosGestionPeriodo.length}
            detalle={`${reunionesPeriodo.length} reuniones/agenda`}
          />
          <Metrica
            icono={FileText}
            titulo="Registros"
            valor={registrosPeriodo.length}
            detalle="en el período"
          />
          <Metrica
            icono={CircleDollarSign}
            titulo="Costo eventos"
            valor={dinero(costoEventosPeriodo)}
            detalle="eventos del período"
            compacto
          />
        </section>

        <nav className="no-print mt-6 flex gap-2 overflow-x-auto pb-1">
          {[
            ["resumen", "Resumen"],
            ["pendientes", "Pendientes"],
            ["eventos", "Eventos"],
            ["dependencias", "Dependencias"],
            ["mensual", "Informe mensual"],
          ].map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTab(valor as Tab)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === valor
                  ? "bg-[#102b43] text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-600"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </nav>

        {tab === "resumen" && (
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="print-card rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">
                    Situaciones que requieren atención
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Vencimientos, próximos compromisos y eventos con tareas abiertas.
                  </p>
                </div>
                <AlertTriangle className="text-amber-500" size={22} />
              </div>

              <div className="mt-4 space-y-2">
                {situacionesAtencion.length ? (
                  situacionesAtencion.map((item, index) => (
                    <a
                      key={`${item.tipo}-${index}-${item.titulo}`}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
                    >
                      <div
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          item.nivel === "alta"
                            ? "bg-red-500"
                            : "bg-amber-400"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          {item.tipo}
                        </p>
                        <p className="truncate text-sm font-bold text-[#102b43]">
                          {item.titulo}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.detalle}
                        </p>
                      </div>

                      <ChevronRight
                        size={17}
                        className="shrink-0 text-slate-400"
                      />
                    </a>
                  ))
                ) : (
                  <Vacio texto="No hay alertas relevantes en este momento." />
                )}
              </div>
            </section>

            <section className="print-card rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
              <h2 className="text-lg font-extrabold">
                Actividad por dependencia
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Movimientos detectados en el período seleccionado.
              </p>

              <div className="mt-5 space-y-4">
                {actividadDependencias
                  .filter((d) => d.total > 0)
                  .slice(0, 8)
                  .map((dep) => {
                    const max =
                      actividadDependencias[0]?.total || 1;
                    const ancho = Math.max(
                      6,
                      Math.round((dep.total / max) * 100)
                    );

                    return (
                      <div key={dep.id}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-semibold">
                            {dep.nombre}
                          </span>
                          <span className="font-extrabold">
                            {dep.total}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-cyan-600"
                            style={{ width: `${ancho}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                {!actividadDependencias.some((d) => d.total > 0) && (
                  <Vacio texto="No hay actividad registrada para este filtro." />
                )}
              </div>
            </section>

            <section className="print-card rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)] xl:col-span-2">
              <div className="grid gap-5 md:grid-cols-4">
                <DatoSecundario
                  icono={Users}
                  titulo="Personal activo"
                  valor={String(personalActivo.length)}
                />
                <DatoSecundario
                  icono={Building2}
                  titulo="Dependencias activas"
                  valor={String(
                    dependenciaFiltro === "todas"
                      ? dependencias.length
                      : 1
                  )}
                />
                <DatoSecundario
                  icono={ClipboardCheck}
                  titulo="Checklist eventos"
                  valor={`${itemsCompletados.length}/${itemsRequeridos.length}`}
                  detalle={`${porcentaje(
                    itemsCompletados.length,
                    itemsRequeridos.length
                  )}% completado`}
                />
                <DatoSecundario
                  icono={CircleDollarSign}
                  titulo="Costo eventos cargados"
                  valor={dinero(costoEventosTotalFiltro)}
                />
              </div>
            </section>
          </div>
        )}

        {tab === "pendientes" && (
          <section className="print-card mt-5 rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
            <div className="grid gap-4 md:grid-cols-4">
              <DatoGrande
                titulo="Activos"
                valor={pendientesAbiertos.length}
                clase="bg-blue-50 text-blue-800"
              />
              <DatoGrande
                titulo="Creados"
                valor={pendientesCreadosPeriodo.length}
                clase="bg-cyan-50 text-cyan-800"
              />
              <DatoGrande
                titulo="Completados"
                valor={pendientesCompletadosPeriodo.length}
                clase="bg-emerald-50 text-emerald-800"
              />
              <DatoGrande
                titulo="Vencidos"
                valor={vencidos.length}
                clase="bg-red-50 text-red-700"
              />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <div>
                <h2 className="font-extrabold">
                  Pendientes abiertos
                </h2>
                <div className="mt-3 space-y-2">
                  {[...pendientesAbiertos]
                    .sort((a, b) => {
                      const porPrioridad =
                        prioridadOrden(a.prioridad) -
                        prioridadOrden(b.prioridad);
                      if (porPrioridad !== 0) return porPrioridad;
                      return (a.fecha_limite || "9999").localeCompare(
                        b.fecha_limite || "9999"
                      );
                    })
                    .slice(0, 15)
                    .map((p) => (
                      <a
                        key={p.id}
                        href="/pendientes"
                        className="block rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold">{p.titulo}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {dependenciaNombre.get(
                                p.dependencia_id || ""
                              ) || "General"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase text-slate-600">
                            {p.prioridad || "normal"}
                          </span>
                        </div>
                        <p
                          className={`mt-2 text-xs font-semibold ${
                            p.fecha_limite &&
                            p.fecha_limite < fechaISO(HOY)
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {p.fecha_limite
                            ? `Vence ${fechaHumana(p.fecha_limite)}`
                            : "Sin fecha límite"}
                        </p>
                      </a>
                    ))}

                  {!pendientesAbiertos.length && (
                    <Vacio texto="No hay pendientes activos." />
                  )}
                </div>
              </div>

              <div>
                <h2 className="font-extrabold">
                  Resolución en el período
                </h2>
                <div className="mt-3 rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    Pendientes creados frente a pendientes completados.
                  </p>

                  <div className="mt-5 space-y-4">
                    <Barra
                      titulo="Creados"
                      valor={pendientesCreadosPeriodo.length}
                      max={Math.max(
                        pendientesCreadosPeriodo.length,
                        pendientesCompletadosPeriodo.length,
                        1
                      )}
                    />
                    <Barra
                      titulo="Completados"
                      valor={pendientesCompletadosPeriodo.length}
                      max={Math.max(
                        pendientesCreadosPeriodo.length,
                        pendientesCompletadosPeriodo.length,
                        1
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "eventos" && (
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="print-card rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">
                    Seguimiento de eventos
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Avance de necesidades y checklist.
                  </p>
                </div>
                <a
                  href="/eventos"
                  className="no-print text-sm font-bold text-cyan-700"
                >
                  Abrir Eventos →
                </a>
              </div>

              <div className="mt-4 space-y-3">
                {eventosSeguimiento.map((evento) => (
                  <a
                    key={evento.id}
                    href={`/eventos/${evento.id}`}
                    className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-extrabold">
                          {evento.nombre}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {evento.fecha
                            ? fechaHumana(evento.fecha)
                            : "Sin fecha"}{" "}
                          {evento.lugar ? `· ${evento.lugar}` : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-sm font-extrabold">
                          {evento.progreso}%
                        </p>
                        <p className="text-xs text-slate-500">
                          {evento.hechos}/{evento.requeridos} ítems
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${evento.progreso}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                      <span>{evento.faltantes} pendientes</span>
                      <span>{dinero(numero(evento.costo))}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <div className="space-y-5">
              <section className="print-card rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
                <h2 className="font-extrabold">Costos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Eventos cuya fecha cae en el período.
                </p>
                <p className="mt-4 text-3xl font-extrabold">
                  {dinero(costoEventosPeriodo)}
                </p>
              </section>

              <section className="print-card rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
                <h2 className="font-extrabold">
                  Proveedores con mayor monto
                </h2>
                <div className="mt-4 space-y-3">
                  {proveedores.map((proveedor) => (
                    <div
                      key={proveedor.nombre}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {proveedor.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {proveedor.cantidad} ítems
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-extrabold">
                        {dinero(proveedor.costo)}
                      </p>
                    </div>
                  ))}

                  {!proveedores.length && (
                    <Vacio texto="No hay proveedores con costos cargados." />
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === "dependencias" && (
          <section className="print-card mt-5 rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
            <div>
              <h2 className="text-lg font-extrabold">
                Actividad por dependencia
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pendientes actualizados, eventos, reuniones y registros dentro del período.
              </p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">Dependencia</th>
                    <th className="px-3 py-3 text-center">Pendientes</th>
                    <th className="px-3 py-3 text-center">Eventos</th>
                    <th className="px-3 py-3 text-center">Reuniones</th>
                    <th className="px-3 py-3 text-center">Registros</th>
                    <th className="px-3 py-3 text-center">Actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {actividadDependencias.map((dep) => (
                    <tr
                      key={dep.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-3">
                        <p className="font-bold">{dep.nombre}</p>
                        <p className="text-xs text-slate-500">
                          {dep.area || "Sin área"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        {dep.pendientes}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        {dep.eventos}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        {dep.reuniones}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        {dep.registros}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex min-w-9 justify-center rounded-full bg-cyan-50 px-2 py-1 font-extrabold text-cyan-800">
                          {dep.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "mensual" && (
          <InformeMensual
            desde={desde}
            hasta={hasta}
            dependencia={
              dependenciaFiltro === "todas"
                ? "Todas las dependencias"
                : dependenciaNombre.get(dependenciaFiltro) ||
                  "Dependencia"
            }
            pendientesActivos={pendientesAbiertos.length}
            creados={pendientesCreadosPeriodo.length}
            completados={pendientesCompletadosPeriodo.length}
            vencidos={vencidos.length}
            reuniones={reunionesPeriodo.length}
            eventos={eventosGestionPeriodo.length}
            registros={registrosPeriodo.length}
            costo={costoEventosPeriodo}
            itemsCompletados={itemsCompletados.length}
            itemsTotal={itemsRequeridos.length}
            actividad={actividadDependencias}
            atencion={situacionesAtencion.length}
          />
        )}
      </div>
    </main>
  );
}

function Metrica({
  icono: Icon,
  titulo,
  valor,
  detalle,
  compacto = false,
}: {
  icono: ElementType;
  titulo: string;
  valor: number | string;
  detalle: string;
  compacto?: boolean;
}) {
  return (
    <div className="print-card rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,43,70,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
          <Icon size={18} />
        </div>
      </div>

      <p
        className={`mt-4 font-extrabold tracking-tight ${
          compacto ? "text-xl" : "text-3xl"
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-sm font-bold">{titulo}</p>
      <p className="mt-1 text-xs text-slate-500">{detalle}</p>
    </div>
  );
}

function DatoSecundario({
  icono: Icon,
  titulo,
  valor,
  detalle,
}: {
  icono: ElementType;
  titulo: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon size={19} className="text-cyan-700" />
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 text-xl font-extrabold">{valor}</p>
      {detalle && (
        <p className="mt-1 text-xs text-slate-500">{detalle}</p>
      )}
    </div>
  );
}

function DatoGrande({
  titulo,
  valor,
  clase,
}: {
  titulo: string;
  valor: number;
  clase: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ${clase}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-extrabold">{valor}</p>
    </div>
  );
}

function Barra({
  titulo,
  valor,
  max,
}: {
  titulo: string;
  valor: number;
  max: number;
}) {
  const ancho = Math.max(valor ? 8 : 0, Math.round((valor / max) * 100));

  return (
    <div>
      <div className="flex justify-between gap-3 text-sm font-bold">
        <span>{titulo}</span>
        <span>{valor}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-cyan-600"
          style={{ width: `${ancho}%` }}
        />
      </div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
      {texto}
    </div>
  );
}

function InformeMensual({
  desde,
  hasta,
  dependencia,
  pendientesActivos,
  creados,
  completados,
  vencidos,
  reuniones,
  eventos,
  registros,
  costo,
  itemsCompletados,
  itemsTotal,
  actividad,
  atencion,
}: {
  desde: string;
  hasta: string;
  dependencia: string;
  pendientesActivos: number;
  creados: number;
  completados: number;
  vencidos: number;
  reuniones: number;
  eventos: number;
  registros: number;
  costo: number;
  itemsCompletados: number;
  itemsTotal: number;
  actividad: ActividadDependencia[];
  atencion: number;
}) {
  const top = actividad.filter((d) => d.total > 0).slice(0, 5);
  const mes = nombreMes(desde);

  return (
    <article className="print-card mt-5 rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_5px_16px_rgba(15,43,70,0.05)] md:p-8">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
          Informe automático de gestión
        </p>
        <h2 className="mt-2 text-2xl font-extrabold capitalize">
          {mes}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {dependencia} · {fechaHumana(desde)} al {fechaHumana(hasta)}
        </p>
      </div>

      <div className="mt-6 space-y-6 text-[15px] leading-7 text-slate-700">
        <p>
          Durante el período seleccionado se registraron{" "}
          <strong>{creados} nuevos pendientes</strong> y se marcaron{" "}
          <strong>{completados} como resueltos</strong>. Actualmente el
          filtro seleccionado presenta{" "}
          <strong>{pendientesActivos} pendientes activos</strong>
          {vencidos > 0
            ? `, de los cuales ${vencidos} se encuentran vencidos`
            : ", sin pendientes vencidos detectados"}
          .
        </p>

        <p>
          La agenda registra <strong>{reuniones} reuniones o compromisos</strong>{" "}
          dentro del período y <strong>{eventos} eventos de gestión</strong>.
          También se generaron <strong>{registros} registros de actividad</strong>.
        </p>

        <p>
          En la gestión de eventos, el monto total correspondiente a los eventos
          fechados dentro del período es de <strong>{dinero(costo)}</strong>.
          El seguimiento logístico general tiene{" "}
          <strong>{itemsCompletados} de {itemsTotal} ítems completados</strong>{" "}
          ({porcentaje(itemsCompletados, itemsTotal)}%).
        </p>

        {top.length > 0 && (
          <div>
            <h3 className="font-extrabold text-[#102b43]">
              Dependencias con mayor actividad
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {top.map((dep) => (
                <div
                  key={dep.id}
                  className="rounded-xl bg-slate-50 px-4 py-3"
                >
                  <p className="font-bold text-[#102b43]">
                    {dep.nombre}
                  </p>
                  <p className="text-sm text-slate-500">
                    {dep.total} movimientos registrados
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`rounded-2xl border p-4 ${
            atencion > 0
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {atencion > 0 ? (
              <AlertTriangle
                size={21}
                className="mt-0.5 shrink-0 text-amber-600"
              />
            ) : (
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
            )}

            <div>
              <h3 className="font-extrabold text-[#102b43]">
                Situaciones que requieren atención
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {atencion > 0
                  ? `GI detecta ${atencion} situaciones para revisar entre vencimientos, compromisos próximos y eventos con ítems abiertos. Consultá la pestaña Resumen para ver el detalle.`
                  : "No se detectan alertas prioritarias con la información actualmente cargada."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Generado automáticamente por Gestión Institucional a partir de los datos
        registrados en la aplicación.
      </footer>
    </article>
  );
}
