"use client";

import {
  Home,
  Search,
  Plus,
  CalendarDays,
  MoreHorizontal,
  Users,
  Building2,
  ClipboardList,
  FileText,
  Bell,
  ChevronRight,
  Inbox,
  FolderOpen,
} from "lucide-react";

const resumen = [
  {
    titulo: "Personal",
    valor: "282",
    icono: Users,
    href: "/personal",
  },
  {
    titulo: "Dependencias",
    valor: "33",
    icono: Building2,
    href: "/dependencias",
  },
  {
    titulo: "Pendientes",
    valor: "1",
    icono: ClipboardList,
    href: "/pendientes",
  },
  {
    titulo: "Eventos",
    valor: "9",
    icono: CalendarDays,
    href: "/agenda",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#edf5f7] text-slate-900">

      <div className="mx-auto max-w-3xl px-3 pb-24 pt-3 md:max-w-7xl md:px-8 md:pb-8 md:pt-6">

        <header className="mb-3 flex items-center justify-between md:mb-6">
          <div>
            <p className="text-xs font-medium text-slate-500 md:hidden">
              Gestión Institucional
            </p>
            <h1 className="text-xl font-bold md:text-2xl">
              Inicio
            </h1>
          </div>

          <button className="rounded-full bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
            <Bell size={19} className="text-slate-600" />
          </button>
        </header>

        <section className="rounded-2xl bg-[#d8eef3] p-3 shadow-sm ring-1 ring-[#c7e3e9] md:p-5">

          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <Search size={18} className="text-slate-500" />

            <input
              type="text"
              placeholder="Buscar en toda la gestión..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
            />

            <ChevronRight size={18} className="text-slate-400" />
          </div>

        </section>

        <section className="mt-3 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-4">
          {resumen.map((item) => {
            const Icon = item.icono;

            return (
              <a
                key={item.titulo}
                href={item.href}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                    <Icon size={20} />
                  </div>

                  <ChevronRight size={18} className="text-slate-400" />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-700">
                  {item.titulo}
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {item.valor}
                </p>
              </a>
            );
          })}
        </section>

        <section className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:mt-6 md:p-5">
          <div className="flex items-center justify-between">

            <h2 className="font-semibold">
              Próximo evento
            </h2>

            <a
              href="/agenda"
              className="text-sm font-medium text-cyan-700"
            >
              Ver agenda
            </a>

          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">

            <p className="font-semibold text-slate-900">
              Fiesta de Reyes
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays size={16} />
              05/01/2026
            </div>

            <p className="mt-1 text-sm text-slate-600">
              Predio
            </p>

          </div>
        </section>

        <section className="mt-3 grid gap-3 md:mt-6 md:grid-cols-2">

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
            <div className="flex items-center justify-between">

              <h2 className="font-semibold">
                Registros recientes
              </h2>

              <a
                href="/registros"
                className="text-sm font-medium text-cyan-700"
              >
                Ver todos
              </a>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                Reunión
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                Reunión con equipo del Centro Cultural
              </p>

              <p className="mt-1 text-xs text-slate-500">
                12/09/2026 · 05:58 p. m.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">

            <div className="flex items-center justify-between">

              <h2 className="font-semibold">
                Bandeja
              </h2>

              <Inbox size={19} className="text-cyan-700" />

            </div>

            <div className="mt-6 flex min-h-24 items-center justify-center text-sm text-slate-500">
              Todavía no hay ingresos.
            </div>

          </div>

        </section>

        <section className="mt-3 grid grid-cols-2 gap-3 md:mt-6 md:grid-cols-3">

          <a
            href="/registrar"
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between">
              <Plus size={20} className="text-cyan-700" />
            </div>

            <p className="mt-3 font-semibold">
              Registrar información
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Texto, archivo, foto o audio
            </p>
          </a>

          <a
            href="/documentos"
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <FolderOpen size={20} className="text-cyan-700" />

            <p className="mt-3 font-semibold">
              Documentos
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Archivos institucionales
            </p>
          </a>

          <a
            href="/bandeja"
            className="col-span-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:col-span-1"
          >
            <Inbox size={20} className="text-cyan-700" />

            <p className="mt-3 font-semibold">
              Bandeja
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Información recibida
            </p>
          </a>

        </section>

      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">

        <div className="grid grid-cols-5">

          <a
            href="/"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-cyan-700"
          >
            <Home size={19} />
            Inicio
          </a>

          <a
            href="/buscar"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
          >
            <Search size={19} />
            Buscar
          </a>

          <a
            href="/registrar"
            className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
          >
            <div className="absolute -top-5 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg">
              <Plus size={23} />
            </div>

            <span className="mt-4">
              Añadir
            </span>
          </a>

          <a
            href="/agenda"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
          >
            <CalendarDays size={19} />
            Agenda
          </a>

          <a
            href="/dependencias"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500"
          >
            <MoreHorizontal size={19} />
            Más
          </a>

        </div>

      </nav>

    </main>
  );
}
