"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Home,
  Search,
  Plus,
  Users,
  Building2,
  ClipboardList,
  CalendarDays,
  CheckSquare,
  FileText,
  ChevronRight,
  MapPin,
  Clock3,
  AlertCircle,
  Loader2,
  Settings,
  BarChart3,
  FolderOpen,
  X,
  PenLine,
  Mic,
  Paperclip,
  Star,
  ListTodo,
  Bell,
  MoreHorizontal,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
};

type TodoItem = {
  id: string;
  tipo: "tarea" | "evento" | "nota";
  titulo: string;
  detalle: string | null;
  fecha: string | null;
  hora: string | null;
  prioridad: string | null;
};

const menu = [
  { name: "Mi jornada", icon: Home, href: "/" },
  { name: "Mi lista", icon: ListTodo, href: "/todo" },
  { name: "Agenda", icon: CalendarDays, href: "/agenda" },
  { name: "Pendientes", icon: ClipboardList, href: "/pendientes" },
  { name: "Dependencias", icon: Building2, href: "/dependencias" },
  { name: "Personal", icon: Users, href: "/personal" },
  { name: "Documentos", icon: FolderOpen, href: "/documentos" },
  { name: "Registros", icon: FileText, href: "/registros" },
  { name: "Informes", icon: BarChart3, href: "/informes" },
];

export default function InicioPage() {
  const supabase = createClient();

  const [cargando, setCargando] = useState(true);
  const [mostrarRegistrar, setMostrarRegistrar] = useState(false);

  const [personal, setPersonal] = useState(0);
  const [dependencias, setDependencias] = useState(0);
  const [pendientes, setPendientes] = useState(0);

  const [proximoEvento, setProximoEvento] =
    useState<Evento | null>(null);

  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    cargarInicio();
  }, []);

  function fechaLocal() {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  async function cargarInicio() {
    setCargando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const hoy = fechaLocal();

    const [
      personasResult,
      dependenciasResult,
      pendientesResult,
      proximoResult,
      todoResult,
    ] = await Promise.all([
      supabase
        .from("personas")
        .select("*", { count: "exact", head: true })
        .eq("activo", true),

      supabase
        .from("dependencias")
        .select("*", { count: "exact", head: true })
        .eq("activa", true),

      supabase
        .from("pendientes")
        .select("*", { count: "exact", head: true })
        .eq("completado", false),

      supabase
        .from("eventos")
        .select("id,nombre,fecha,hora,lugar")
        .gte("fecha", hoy)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("todo_unificado")
        .select("id,tipo,titulo,detalle,fecha,hora,prioridad")
        .limit(6),
    ]);

    setPersonal(personasResult.count || 0);
    setDependencias(dependenciasResult.count || 0);
    setPendientes(pendientesResult.count || 0);

    setProximoEvento(proximoResult.data || null);

    const lista = (todoResult.data || []) as TodoItem[];

    lista.sort((a, b) => {
      if (a.fecha && b.fecha) {
        return (
          new Date(
            `${a.fecha}T${a.hora || "23:59"}`
          ).getTime() -
          new Date(
            `${b.fecha}T${b.hora || "23:59"}`
          ).getTime()
        );
      }

      if (a.fecha) return -1;
      if (b.fecha) return 1;

      if (a.prioridad === "alta") return -1;
      if (b.prioridad === "alta") return 1;

      return 0;
    });

    setTodoItems(lista.slice(0, 5));

    setCargando(false);
  }

  function fechaBonita(fecha: string | null) {
    if (!fecha) return "";

    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(fecha + "T12:00:00"));
  }

  function iconoTodo(tipo: string) {
    if (tipo === "evento") return CalendarDays;
    if (tipo === "nota") return FileText;
    return CheckSquare;
  }

  function estiloTodo(tipo: string) {
    if (tipo === "evento") {
      return "bg-blue-100 text-blue-700";
    }

    if (tipo === "nota") {
      return "bg-violet-100 text-violet-700";
    }

    return "bg-emerald-100 text-emerald-700";
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf2f7]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            className="animate-spin"
            size={22}
          />
          Cargando...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf2f7] text-[#102a43]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-[250px] flex-col bg-[#0b2d49] text-white lg:flex">

          <div className="border-b border-white/10 px-5 py-6">
            <div className="flex items-center gap-3">
              <Building2 size={22} />

              <div>
                <h1 className="font-semibold">
                  Cultura · Gestión
                </h1>

                <p className="mt-0.5 text-[11px] text-slate-300">
                  Gestión Institucional
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">

            {menu.map((item, index) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    index === 0
                      ? "bg-cyan-600 text-white"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <Icon size={17} />

                  {item.name}
                </Link>
              );
            })}

          </nav>

          <div className="border-t border-white/10 p-3">

            <button
              onClick={() => setMostrarRegistrar(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-500"
            >
              <Plus size={19} />
              Registrar
            </button>

            <Link
              href="/configuracion"
              className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              <Settings size={17} />
              Configuración
            </Link>

          </div>

        </aside>


        {/* CONTENIDO */}

        <section className="min-w-0 flex-1 pb-24 lg:pb-8">

          {/* HEADER */}

          <header className="border-b border-slate-200 bg-white">

            <div className="mx-auto flex max-w-[1350px] items-center gap-5 px-5 py-3">

              <div className="hidden flex-1 lg:block">

                <Link
                  href="/buscar"
                  className="mx-auto flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-300"
                >
                  <Search size={15} />

                  Buscar en Cultura · Gestión...
                </Link>

              </div>

              <div className="ml-auto flex items-center gap-2">

                <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                  <Bell size={19} />
                </button>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2d49] text-sm font-semibold text-white">
                  H
                </div>

              </div>

            </div>

          </header>


          <div className="mx-auto max-w-[1350px] px-4 py-6 md:px-6">

            {/* TITULO */}

            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Mi jornada
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Información que requiere atención
              </p>
            </div>


            {/* PRINCIPAL */}

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_.8fr]">

              <div className="space-y-5">

                {/* COMPROMISOS */}

                <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex items-center gap-2">
                      <Star
                        size={19}
                        className="text-amber-500"
                      />

                      <h3 className="font-semibold">
                        Compromisos prioritarios
                      </h3>
                    </div>

                    <Link
                      href="/pendientes"
                      className="text-xs font-semibold text-cyan-700"
                    >
                      Ver todos
                    </Link>

                  </div>

                  {pendientes > 0 ? (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">

                      <div className="flex items-center justify-between gap-4">

                        <div>
                          <p className="text-sm font-semibold">
                            {pendientes} pendientes activos
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Requieren seguimiento
                          </p>
                        </div>

                        <Link
                          href="/pendientes"
                          className="rounded-lg bg-[#0b8f94] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Revisar
                        </Link>

                      </div>

                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      No hay compromisos pendientes.
                    </div>
                  )}

                </section>


                {/* TODO */}

                <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <ListTodo
                        size={19}
                        className="text-cyan-700"
                      />

                      <h3 className="font-semibold">
                        Mi lista
                      </h3>

                    </div>

                    <Link
                      href="/todo"
                      className="text-xs font-semibold text-cyan-700"
                    >
                      Ver todo
                    </Link>

                  </div>

                  <div className="divide-y divide-slate-100">

                    {todoItems.length > 0 ? (
                      todoItems.map((item) => {
                        const Icon = iconoTodo(item.tipo);

                        return (
                          <div
                            key={`${item.tipo}-${item.id}`}
                            className="flex items-center gap-3 py-3"
                          >

                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${estiloTodo(
                                item.tipo
                              )}`}
                            >
                              <Icon size={16} />
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-medium">
                                {item.titulo}
                              </p>

                              <div className="mt-1 flex gap-3 text-[11px] text-slate-400">

                                {item.fecha && (
                                  <span>
                                    {fechaBonita(item.fecha)}
                                  </span>
                                )}

                                {item.hora && (
                                  <span>
                                    {item.hora.slice(0, 5)}
                                  </span>
                                )}

                              </div>

                            </div>

                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                item.tipo === "evento"
                                  ? "bg-blue-100 text-blue-700"
                                  : item.tipo === "nota"
                                  ? "bg-violet-100 text-violet-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.tipo}
                            </span>

                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-sm text-slate-400">
                        La lista está vacía.
                      </div>
                    )}

                  </div>

                </section>

              </div>


              {/* COLUMNA DERECHA */}

              <div className="space-y-5">

                {/* PROXIMO EVENTO */}

                <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <CalendarDays
                        size={19}
                        className="text-cyan-700"
                      />

                      <h3 className="font-semibold">
                        Próximo evento
                      </h3>

                    </div>

                    <Link
                      href="/agenda"
                      className="text-xs font-semibold text-cyan-700"
                    >
                      Agenda
                    </Link>

                  </div>

                  {proximoEvento ? (
                    <div className="mt-4 border-l-4 border-cyan-500 pl-4">

                      <p className="font-semibold">
                        {proximoEvento.nombre}
                      </p>

                      <div className="mt-3 space-y-2 text-sm text-slate-500">

                        {proximoEvento.fecha && (
                          <div className="flex items-center gap-2">
                            <CalendarDays size={15} />

                            {fechaBonita(proximoEvento.fecha)}
                          </div>
                        )}

                        {proximoEvento.hora && (
                          <div className="flex items-center gap-2">
                            <Clock3 size={15} />

                            {proximoEvento.hora.slice(0, 5)}
                          </div>
                        )}

                        {proximoEvento.lugar && (
                          <div className="flex items-center gap-2">
                            <MapPin size={15} />

                            {proximoEvento.lugar}
                          </div>
                        )}

                      </div>

                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-slate-400">
                      No hay próximos eventos.
                    </div>
                  )}

                </section>


                {/* ESPERANDO */}

                <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">

                  <div className="flex items-center gap-2">

                    <Clock3
                      size={19}
                      className="text-cyan-700"
                    />

                    <h3 className="font-semibold">
                      Esperando respuesta
                    </h3>

                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-400">
                    Sin elementos por ahora.
                  </div>

                </section>

              </div>

            </div>


            {/* CONSULTA */}

            <section className="mt-6">

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Consulta
              </p>

              <div className="grid gap-3 md:grid-cols-3">

                <Link
                  href="/personal"
                  className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Users
                    size={19}
                    className="text-cyan-700"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Personal
                    </p>

                    <p className="text-xs text-slate-500">
                      {personal} registros
                    </p>
                  </div>

                  <ChevronRight size={17} />
                </Link>


                <Link
                  href="/dependencias"
                  className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Building2
                    size={19}
                    className="text-cyan-700"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Dependencias
                    </p>

                    <p className="text-xs text-slate-500">
                      {dependencias} espacios
                    </p>
                  </div>

                  <ChevronRight size={17} />
                </Link>


                <Link
                  href="/registros"
                  className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <FileText
                    size={19}
                    className="text-cyan-700"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Registros
                    </p>

                    <p className="text-xs text-slate-500">
                      Historial institucional
                    </p>
                  </div>

                  <ChevronRight size={17} />
                </Link>

              </div>

            </section>

          </div>

        </section>

      </div>


      {/* NAVEGACION MOVIL */}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white lg:hidden">

        <div className="grid grid-cols-5">

          <Link
            href="/"
            className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-cyan-700"
          >
            <Home size={19} />
            Hoy
          </Link>

          <Link
            href="/todo"
            className="flex flex-col items-center gap-1 py-3 text-[11px] text-slate-500"
          >
            <ListTodo size={19} />
            Lista
          </Link>

          <button
            onClick={() => setMostrarRegistrar(true)}
            className="relative flex flex-col items-center gap-1 py-3 text-[11px] text-slate-600"
          >
            <span className="absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg">
              <Plus size={22} />
            </span>

            <span className="mt-5">
              Registrar
            </span>
          </button>

          <Link
            href="/agenda"
            className="flex flex-col items-center gap-1 py-3 text-[11px] text-slate-500"
          >
            <CalendarDays size={19} />
            Agenda
          </Link>

          <button className="flex flex-col items-center gap-1 py-3 text-[11px] text-slate-500">
            <MoreHorizontal size={19} />
            Más
          </button>

        </div>

      </nav>


      {/* MODAL REGISTRAR */}

      {mostrarRegistrar && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">

          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Registrar
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Elegí cómo querés ingresar la información.
                </p>
              </div>

              <button
                onClick={() => setMostrarRegistrar(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">

              <Link
                href="/registrar?tipo=texto"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-cyan-500 hover:bg-cyan-50"
              >
                <PenLine
                  size={24}
                  className="text-[#0b2d49]"
                />

                <span className="text-sm font-semibold">
                  Escribir
                </span>
              </Link>

              <Link
                href="/registrar?tipo=audio"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-cyan-500 hover:bg-cyan-50"
              >
                <Mic
                  size={24}
                  className="text-[#0b2d49]"
                />

                <span className="text-sm font-semibold">
                  Audio
                </span>
              </Link>

              <Link
                href="/registrar?tipo=archivo"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-cyan-500 hover:bg-cyan-50"
              >
                <Paperclip
                  size={24}
                  className="text-[#0b2d49]"
                />

                <span className="text-sm font-semibold">
                  Archivo
                </span>
              </Link>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}
