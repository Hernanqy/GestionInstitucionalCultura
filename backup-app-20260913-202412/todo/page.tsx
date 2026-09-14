"use client";

import {
  CheckSquare,
  CalendarDays,
  Pin,
  Search,
  Plus,
  Clock3,
  AlertCircle,
  Loader2,
  X,
  Check,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ItemTodo = {
  id: string;
  tipo: "tarea" | "evento" | "nota";
  titulo: string;
  detalle: string | null;
  fecha: string | null;
  hora: string | null;
  prioridad: string | null;
  completado: boolean;
  dependencia_id: string | null;
  created_at: string;
  origen: string;
};

export default function TodoPage() {
  const supabase = createClient();

  const [items, setItems] = useState<ItemTodo[]>([]);
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<"tarea" | "nota">("tarea");
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [fecha, setFecha] = useState("");
  const [prioridad, setPrioridad] = useState("normal");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("todo_unificado")
      .select("*");

    if (error) {
      console.error(error);
      setCargando(false);
      return;
    }

    const ordenados = (data || []).sort((a, b) => {
      if (a.fecha && b.fecha) {
        const fa = new Date(`${a.fecha}T${a.hora || "23:59"}`);
        const fb = new Date(`${b.fecha}T${b.hora || "23:59"}`);
        return fa.getTime() - fb.getTime();
      }

      if (a.fecha) return -1;
      if (b.fecha) return 1;

      if (a.prioridad === "alta" && b.prioridad !== "alta") return -1;
      if (b.prioridad === "alta" && a.prioridad !== "alta") return 1;

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    setItems(ordenados);
    setCargando(false);
  }

  async function guardarNuevo() {
    if (!titulo.trim()) return;

    setGuardando(true);

    if (tipoNuevo === "tarea") {
      const { error } = await supabase.from("pendientes").insert({
        titulo: titulo.trim(),
        descripcion: detalle.trim() || null,
        prioridad,
        fecha_limite: fecha || null,
        completado: false,
      });

      if (error) {
        console.error(error);
        setGuardando(false);
        return;
      }
    }

    if (tipoNuevo === "nota") {
      const { error } = await supabase.from("anotaciones_clave").insert({
        titulo: titulo.trim(),
        contenido: detalle.trim() || null,
        prioridad,
        fijada: true,
        activa: true,
      });

      if (error) {
        console.error(error);
        setGuardando(false);
        return;
      }
    }

    setTitulo("");
    setDetalle("");
    setFecha("");
    setPrioridad("normal");
    setMostrarForm(false);
    setGuardando(false);

    await cargar();
  }

  async function completarTarea(id: string) {
    const { error } = await supabase
      .from("pendientes")
      .update({ completado: true })
      .eq("id", id);

    if (!error) {
      await cargar();
    }
  }

  async function quitarNota(id: string) {
    const { error } = await supabase
      .from("anotaciones_clave")
      .update({ activa: false })
      .eq("id", id);

    if (!error) {
      await cargar();
    }
  }

  const resultado = useMemo(() => {
    return items.filter((item) => {
      const texto =
        `${item.titulo} ${item.detalle || ""}`.toLowerCase();

      const coincideBusqueda = texto.includes(
        buscar.toLowerCase()
      );

      const coincideFiltro =
        filtro === "todos" || item.tipo === filtro;

      return coincideBusqueda && coincideFiltro;
    });
  }, [items, buscar, filtro]);

  function fechaBonita(fecha: string | null) {
    if (!fecha) return null;

    return new Intl.DateTimeFormat("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date(fecha + "T12:00:00"));
  }

  function icono(item: ItemTodo) {
    if (item.tipo === "evento") return CalendarDays;
    if (item.tipo === "nota") return Pin;
    return CheckSquare;
  }

  function etiqueta(item: ItemTodo) {
    if (item.tipo === "evento") return "Evento";
    if (item.tipo === "nota") return "Nota clave";
    return "Tarea";
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-200/80">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={22} />
          Cargando lista...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-200/80 text-slate-900">
      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Mi lista
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Tareas, próximos eventos y anotaciones clave
            </p>
          </div>

          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f2b46] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173c5d]"
          >
            <Plus size={18} />
            Agregar
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-400 bg-white px-4 py-3 shadow-sm">
          <Search size={18} className="text-slate-500" />

          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar en mi lista..."
            className="w-full bg-transparent text-sm outline-none text-slate-900"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {[
            ["todos", "Todo"],
            ["tarea", "Tareas"],
            ["evento", "Eventos"],
            ["nota", "Notas"],
          ].map(([valor, texto]) => (
            <button
              key={valor}
              onClick={() => setFiltro(valor)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                filtro === valor
                  ? "border-[#0f2b46] bg-[#0f2b46] text-white"
                  : "border-slate-400 bg-white text-slate-700"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>

        <section className="mt-4 space-y-3">

          {resultado.map((item) => {
            const Icon = icono(item);

            return (
              <div
                key={`${item.tipo}-${item.id}`}
                className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      item.tipo === "evento"
                        ? "bg-blue-100 text-blue-700"
                        : item.tipo === "nota"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {etiqueta(item)}
                      </span>

                      {item.prioridad === "alta" && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                          <AlertCircle size={12} />
                          Alta
                        </span>
                      )}

                    </div>

                    <h2 className="mt-1 font-semibold">
                      {item.titulo}
                    </h2>

                    {item.detalle && (
                      <p className="mt-1 text-sm text-slate-600">
                        {item.detalle}
                      </p>
                    )}

                    {(item.fecha || item.hora) && (
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">

                        {item.fecha && (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={15} />
                            {fechaBonita(item.fecha)}
                          </span>
                        )}

                        {item.hora && (
                          <span className="flex items-center gap-1">
                            <Clock3 size={15} />
                            {item.hora.slice(0, 5)}
                          </span>
                        )}

                      </div>
                    )}

                  </div>

                  {item.tipo === "tarea" && (
                    <button
                      onClick={() => completarTarea(item.id)}
                      title="Marcar como realizada"
                      className="rounded-xl border border-slate-300 bg-slate-50 p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Check size={18} />
                    </button>
                  )}

                  {item.tipo === "nota" && (
                    <button
                      onClick={() => quitarNota(item.id)}
                      title="Quitar de la lista"
                      className="rounded-xl border border-slate-300 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <X size={18} />
                    </button>
                  )}

                </div>
              </div>
            );
          })}

          {resultado.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-400 bg-white p-10 text-center">
              <p className="text-sm text-slate-500">
                No hay elementos para mostrar.
              </p>
            </div>
          )}

        </section>

        {mostrarForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-6 shadow-xl">

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Agregar a Mi lista
                </h2>

                <button
                  onClick={() => setMostrarForm(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">

                <button
                  onClick={() => setTipoNuevo("tarea")}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    tipoNuevo === "tarea"
                      ? "border-[#0f2b46] bg-[#0f2b46] text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Tarea
                </button>

                <button
                  onClick={() => setTipoNuevo("nota")}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    tipoNuevo === "nota"
                      ? "border-[#0f2b46] bg-[#0f2b46] text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Nota clave
                </button>

              </div>

              <div className="mt-5 space-y-4">

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Título
                  </label>

                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Detalle
                  </label>

                  <textarea
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-600"
                  />
                </div>

                {tipoNuevo === "tarea" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Fecha límite
                    </label>

                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Prioridad
                  </label>

                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-2">

                <button
                  onClick={() => setMostrarForm(false)}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>

                <button
                  onClick={guardarNuevo}
                  disabled={guardando || !titulo.trim()}
                  className="rounded-xl bg-[#0f2b46] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
