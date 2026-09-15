"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckSquare2,
  ClipboardCopy,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Clasificacion = "informar" | "decision" | "seguimiento";
type TipoOrigen = "agenda" | "pendiente" | "registro" | "evento";

type Dependencia = {
  id: string;
  nombre: string;
};

type Pendiente = {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: string | null;
  fecha_limite: string | null;
  completado: boolean;
  dependencia_id: string | null;
  created_at: string;
  updated_at: string;
};

type Evento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  estado: string | null;
  dependencia_id: string | null;
  es_evento_gestion: boolean;
  created_at: string;
  updated_at: string;
};

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
  dependencia_id: string | null;
  created_at: string;
  updated_at: string;
};

type Candidato = {
  key: string;
  origenId: string;
  tipo: TipoOrigen;
  dependenciaId: string | null;
  dependencia: string;
  titulo: string;
  detalle: string;
  fecha: string | null;
  clasificacionDefault: Clasificacion;
};

type Edicion = {
  incluir: boolean;
  clasificacion: Clasificacion;
  resumen: string;
};

function iso(fecha: Date) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

function inicioMesActual() {
  const hoy = new Date();
  return iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

function fechaCorta(valor: string | null) {
  if (!valor) return "Sin fecha";
  return new Date(`${valor.slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function enRango(valor: string | null | undefined, desde: string, hasta: string) {
  if (!valor) return false;
  const fecha = valor.slice(0, 10);
  return fecha >= desde && fecha <= hasta;
}

function etiquetaTipo(tipo: TipoOrigen) {
  if (tipo === "agenda") return "Agenda";
  if (tipo === "pendiente") return "Pendiente";
  if (tipo === "evento") return "Evento";
  return "Registro";
}

function etiquetaClasificacion(tipo: Clasificacion) {
  if (tipo === "decision") return "Requiere decisión";
  if (tipo === "seguimiento") return "Seguimiento";
  return "Para informar";
}

function prioridadDecision(prioridad: string | null) {
  const valor = (prioridad || "").toLowerCase();
  return valor === "urgente" || valor === "alta";
}

export default function ParteSubsecretariaPage() {
  const supabase = useMemo(() => createClient(), []);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const [desde, setDesde] = useState(inicioMesActual());
  const [hasta, setHasta] = useState(iso(new Date()));
  const [dependenciaFiltro, setDependenciaFiltro] = useState("todas");

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const [ediciones, setEdiciones] = useState<Record<string, Edicion>>({});
  const [mostrarBorrador, setMostrarBorrador] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function cargar(esActualizacion = false) {
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

    const [deps, pends, evs, regs] = await Promise.all([
      supabase
        .from("dependencias")
        .select("id,nombre")
        .eq("activa", true)
        .order("nombre")
        .range(0, 999),

      supabase
        .from("pendientes")
        .select(
          "id,titulo,descripcion,prioridad,fecha_limite,completado,dependencia_id,created_at,updated_at"
        )
        .order("created_at", { ascending: false })
        .range(0, 9999),

      supabase
        .from("eventos")
        .select(
          "id,nombre,descripcion,fecha,hora,lugar,estado,dependencia_id,es_evento_gestion,created_at,updated_at"
        )
        .order("fecha", { ascending: false, nullsFirst: false })
        .range(0, 9999),

      supabase
        .from("registros")
        .select(
          "id,titulo,contenido,tipo,dependencia_id,created_at,updated_at"
        )
        .order("created_at", { ascending: false })
        .range(0, 9999),
    ]);

    const errores = [deps.error, pends.error, evs.error, regs.error].filter(Boolean);

    if (errores.length) {
      console.error(errores);
      setError("No se pudo cargar toda la información para preparar el parte.");
    }

    setDependencias((deps.data || []) as Dependencia[]);
    setPendientes((pends.data || []) as Pendiente[]);
    setEventos((evs.data || []) as Evento[]);
    setRegistros((regs.data || []) as Registro[]);

    setCargando(false);
    setActualizando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombreDependencia = useMemo(
    () => new Map(dependencias.map((dep) => [dep.id, dep.nombre])),
    [dependencias]
  );

  const candidatos = useMemo<Candidato[]>(() => {
    const salida: Candidato[] = [];

    pendientes.forEach((item) => {
      if (
        dependenciaFiltro !== "todas" &&
        item.dependencia_id !== dependenciaFiltro
      ) {
        return;
      }

      const relevante =
        !item.completado ||
        enRango(item.created_at, desde, hasta) ||
        enRango(item.updated_at, desde, hasta) ||
        enRango(item.fecha_limite, desde, hasta);

      if (!relevante) return;

      salida.push({
        key: `pendiente:${item.id}`,
        origenId: item.id,
        tipo: "pendiente",
        dependenciaId: item.dependencia_id,
        dependencia:
          nombreDependencia.get(item.dependencia_id || "") || "General",
        titulo: item.titulo,
        detalle:
          item.descripcion ||
          (item.completado
            ? "Pendiente completado."
            : item.fecha_limite
              ? `Fecha límite: ${fechaCorta(item.fecha_limite)}`
              : "Pendiente activo."),
        fecha: item.fecha_limite,
        clasificacionDefault: prioridadDecision(item.prioridad)
          ? "decision"
          : "seguimiento",
      });
    });

    eventos.forEach((item) => {
      if (
        dependenciaFiltro !== "todas" &&
        item.dependencia_id !== dependenciaFiltro
      ) {
        return;
      }

      if (item.es_evento_gestion) {
        const relevante =
          !item.fecha ||
          enRango(item.fecha, desde, hasta) ||
          enRango(item.updated_at, desde, hasta);

        if (!relevante) return;

        salida.push({
          key: `evento:${item.id}`,
          origenId: item.id,
          tipo: "evento",
          dependenciaId: item.dependencia_id,
          dependencia:
            nombreDependencia.get(item.dependencia_id || "") || "Eventos",
          titulo: item.nombre,
          detalle:
            item.descripcion ||
            [item.lugar, item.estado].filter(Boolean).join(" · ") ||
            "Evento en seguimiento.",
          fecha: item.fecha,
          clasificacionDefault: "seguimiento",
        });
        return;
      }

      if (!enRango(item.fecha, desde, hasta)) return;

      salida.push({
        key: `agenda:${item.id}`,
        origenId: item.id,
        tipo: "agenda",
        dependenciaId: item.dependencia_id,
        dependencia:
          nombreDependencia.get(item.dependencia_id || "") || "General",
        titulo: item.nombre,
        detalle:
          item.descripcion ||
          [item.lugar, item.hora ? `${item.hora.slice(0, 5)} hs` : null]
            .filter(Boolean)
            .join(" · ") ||
          "Actividad de agenda.",
        fecha: item.fecha,
        clasificacionDefault: "informar",
      });
    });

    registros.forEach((item) => {
      if (
        dependenciaFiltro !== "todas" &&
        item.dependencia_id !== dependenciaFiltro
      ) {
        return;
      }

      if (!enRango(item.created_at, desde, hasta)) return;

      salida.push({
        key: `registro:${item.id}`,
        origenId: item.id,
        tipo: "registro",
        dependenciaId: item.dependencia_id,
        dependencia:
          nombreDependencia.get(item.dependencia_id || "") || "General",
        titulo: item.titulo || item.tipo || "Registro",
        detalle: item.contenido || "Registro sin detalle.",
        fecha: item.created_at.slice(0, 10),
        clasificacionDefault: "informar",
      });
    });

    return salida.sort((a, b) => {
      const dep = a.dependencia.localeCompare(b.dependencia, "es");
      if (dep !== 0) return dep;
      return (a.fecha || "9999-12-31").localeCompare(b.fecha || "9999-12-31");
    });
  }, [
    pendientes,
    eventos,
    registros,
    dependenciaFiltro,
    desde,
    hasta,
    nombreDependencia,
  ]);

  useEffect(() => {
    setEdiciones((actual) => {
      const siguiente = { ...actual };

      candidatos.forEach((item) => {
        if (!siguiente[item.key]) {
          siguiente[item.key] = {
            incluir: true,
            clasificacion: item.clasificacionDefault,
            resumen: item.detalle,
          };
        }
      });

      return siguiente;
    });
  }, [candidatos]);

  const seleccionados = useMemo(
    () =>
      candidatos.filter((item) => ediciones[item.key]?.incluir),
    [candidatos, ediciones]
  );

  const conteo = useMemo(() => {
    let informar = 0;
    let decision = 0;
    let seguimiento = 0;

    seleccionados.forEach((item) => {
      const clasificacion =
        ediciones[item.key]?.clasificacion || item.clasificacionDefault;

      if (clasificacion === "decision") decision += 1;
      else if (clasificacion === "seguimiento") seguimiento += 1;
      else informar += 1;
    });

    return { informar, decision, seguimiento };
  }, [seleccionados, ediciones]);

  const agrupados = useMemo(() => {
    const mapa = new Map<string, Candidato[]>();

    seleccionados.forEach((item) => {
      const grupo = mapa.get(item.dependencia) || [];
      grupo.push(item);
      mapa.set(item.dependencia, grupo);
    });

    return Array.from(mapa.entries());
  }, [seleccionados]);

  const textoParte = useMemo(() => {
    const lineas: string[] = [];

    lineas.push("PARTE DE GESTIÓN – SUBSECRETARÍA");
    lineas.push(`Período: ${fechaCorta(desde)} al ${fechaCorta(hasta)}`);
    lineas.push(
      `Resumen: ${seleccionados.length} asuntos · ${conteo.informar} para informar · ${conteo.decision} requieren decisión · ${conteo.seguimiento} en seguimiento`
    );
    lineas.push("");

    agrupados.forEach(([dependencia, items]) => {
      lineas.push(dependencia.toUpperCase());

      (["decision", "seguimiento", "informar"] as Clasificacion[]).forEach(
        (clasificacion) => {
          const filtrados = items.filter(
            (item) =>
              (ediciones[item.key]?.clasificacion ||
                item.clasificacionDefault) === clasificacion
          );

          if (!filtrados.length) return;

          lineas.push(etiquetaClasificacion(clasificacion).toUpperCase());

          filtrados.forEach((item) => {
            const resumen = ediciones[item.key]?.resumen || item.detalle;
            const fecha = item.fecha ? ` (${fechaCorta(item.fecha)})` : "";
            lineas.push(`• ${item.titulo}${fecha}: ${resumen}`);
          });

          lineas.push("");
        }
      );
    });

    return lineas.join("\n").trim();
  }, [desde, hasta, seleccionados, conteo, agrupados, ediciones]);

  function actualizarEdicion(key: string, cambios: Partial<Edicion>) {
    setEdiciones((actual) => ({
      ...actual,
      [key]: {
        ...actual[key],
        ...cambios,
      },
    }));
  }

  async function copiarParte() {
    await navigator.clipboard.writeText(textoParte);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1800);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
        <div className="flex items-center gap-3 font-semibold text-[#102b43]">
          <Loader2 className="animate-spin" size={23} />
          Preparando parte...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-[#102b43] lg:pb-10">
      <style jsx global>{`
        @media print {
          aside,
          nav,
          .no-print {
            display: none !important;
          }

          main {
            background: white !important;
          }

          .print-only {
            display: block !important;
          }

          .print-card {
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="no-print">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#102b43]"
          >
            <ArrowLeft size={17} />
            Inicio
          </a>
        </div>

        <header className="mt-4 flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,43,70,0.05)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-800">
              <FileText size={25} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                Prueba
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                Parte Subsecretaría
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Reuní información de todas las dependencias y elegí qué elevar,
                sin modificar los datos originales de GI.
              </p>
            </div>
          </div>

          <div className="no-print flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => cargar(true)}
              disabled={actualizando}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              <RefreshCw
                size={17}
                className={actualizando ? "animate-spin" : ""}
              />
              Actualizar
            </button>

            <button
              type="button"
              onClick={() => setMostrarBorrador(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f4777] px-4 py-2.5 text-sm font-bold text-white"
            >
              <Sparkles size={17} />
              Generar borrador
            </button>
          </div>
        </header>

        <div className="no-print mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Modo prueba:</strong> la selección y clasificación de este parte
          todavía no se guarda como histórico. Los datos originales sí permanecen
          intactos en Agenda, Pendientes, Registros y Eventos.
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="no-print mt-5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs font-bold text-slate-500">
              Desde
              <input
                type="date"
                value={desde}
                onChange={(e) => {
                  setDesde(e.target.value);
                  setMostrarBorrador(false);
                }}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
              />
            </label>

            <label className="text-xs font-bold text-slate-500">
              Hasta
              <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  setHasta(e.target.value);
                  setMostrarBorrador(false);
                }}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
              />
            </label>

            <label className="text-xs font-bold text-slate-500">
              Dependencia
              <select
                value={dependenciaFiltro}
                onChange={(e) => {
                  setDependenciaFiltro(e.target.value);
                  setMostrarBorrador(false);
                }}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
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
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ResumenCard
            titulo="Seleccionados"
            valor={seleccionados.length}
            detalle={`${candidatos.length} detectados`}
          />
          <ResumenCard
            titulo="Para informar"
            valor={conteo.informar}
            detalle="Información ejecutiva"
          />
          <ResumenCard
            titulo="Requieren decisión"
            valor={conteo.decision}
            detalle="Temas a resolver"
          />
          <ResumenCard
            titulo="Seguimiento"
            valor={conteo.seguimiento}
            detalle="Asuntos en curso"
          />
        </section>

        <section className="no-print mt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">
                Selección para elevar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Desmarcá lo interno y ajustá el resumen que querés mostrar.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {Array.from(
              new Set(candidatos.map((item) => item.dependencia))
            ).map((dependencia) => {
              const items = candidatos.filter(
                (item) => item.dependencia === dependencia
              );

              return (
                <div
                  key={dependencia}
                  className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold">{dependencia}</h3>
                      <p className="text-xs text-slate-500">
                        {items.length} asuntos detectados
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {items.map((item) => {
                      const edit = ediciones[item.key] || {
                        incluir: true,
                        clasificacion: item.clasificacionDefault,
                        resumen: item.detalle,
                      };

                      return (
                        <div
                          key={item.key}
                          className={`rounded-2xl border p-4 transition ${
                            edit.incluir
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-slate-50 opacity-65"
                          }`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                            <label className="flex min-w-0 flex-1 items-start gap-3">
                              <input
                                type="checkbox"
                                checked={edit.incluir}
                                onChange={(e) =>
                                  actualizarEdicion(item.key, {
                                    incluir: e.target.checked,
                                  })
                                }
                                className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
                              />

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                    {etiquetaTipo(item.tipo)}
                                  </span>

                                  {item.fecha && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                                      <CalendarDays size={13} />
                                      {fechaCorta(item.fecha)}
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 font-extrabold">
                                  {item.titulo}
                                </p>
                              </div>
                            </label>

                            <select
                              value={edit.clasificacion}
                              onChange={(e) =>
                                actualizarEdicion(item.key, {
                                  clasificacion: e.target
                                    .value as Clasificacion,
                                })
                              }
                              disabled={!edit.incluir}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
                            >
                              <option value="informar">Para informar</option>
                              <option value="decision">
                                Requiere decisión
                              </option>
                              <option value="seguimiento">Seguimiento</option>
                            </select>
                          </div>

                          <textarea
                            value={edit.resumen}
                            onChange={(e) =>
                              actualizarEdicion(item.key, {
                                resumen: e.target.value,
                              })
                            }
                            disabled={!edit.incluir}
                            rows={2}
                            className="mt-3 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none focus:border-cyan-500 disabled:opacity-50"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!candidatos.length && (
              <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                No se encontraron asuntos para el período y filtro seleccionados.
              </div>
            )}
          </div>
        </section>

        {mostrarBorrador && (
          <section className="print-card mt-6 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="no-print flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold">
                  Borrador del parte
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Este texto se genera con lo que seleccionaste arriba.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copiarParte}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
                >
                  <ClipboardCopy size={17} />
                  {copiado ? "Copiado" : "Copiar texto"}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#102b43] px-4 py-2.5 text-sm font-bold text-white"
                >
                  <Printer size={17} />
                  Imprimir / PDF
                </button>
              </div>
            </div>

            <article className="mt-5">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                  Gestión Institucional
                </p>
                <h2 className="mt-2 text-2xl font-extrabold">
                  Parte de Gestión – Subsecretaría
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {fechaCorta(desde)} al {fechaCorta(hasta)}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniResumen
                  titulo="Para informar"
                  valor={conteo.informar}
                />
                <MiniResumen
                  titulo="Requieren decisión"
                  valor={conteo.decision}
                />
                <MiniResumen
                  titulo="Seguimiento"
                  valor={conteo.seguimiento}
                />
              </div>

              <div className="mt-7 space-y-7">
                {agrupados.map(([dependencia, items]) => (
                  <section key={dependencia}>
                    <h3 className="border-b border-slate-200 pb-2 text-lg font-extrabold">
                      {dependencia}
                    </h3>

                    {(
                      ["decision", "seguimiento", "informar"] as Clasificacion[]
                    ).map((clasificacion) => {
                      const filtrados = items.filter(
                        (item) =>
                          (ediciones[item.key]?.clasificacion ||
                            item.clasificacionDefault) === clasificacion
                      );

                      if (!filtrados.length) return null;

                      return (
                        <div key={clasificacion} className="mt-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-700">
                            {etiquetaClasificacion(clasificacion)}
                          </p>

                          <div className="mt-2 space-y-3">
                            {filtrados.map((item) => (
                              <div
                                key={item.key}
                                className="rounded-xl bg-slate-50 px-4 py-3"
                              >
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <p className="font-bold">{item.titulo}</p>
                                  {item.fecha && (
                                    <span className="text-xs font-semibold text-slate-400">
                                      {fechaCorta(item.fecha)}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {ediciones[item.key]?.resumen ||
                                    item.detalle}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                ))}
              </div>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}

function ResumenCard({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: number;
  detalle: string;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-extrabold">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">{detalle}</p>
    </div>
  );
}

function MiniResumen({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
      <p className="text-2xl font-extrabold">{valor}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{titulo}</p>
    </div>
  );
}
