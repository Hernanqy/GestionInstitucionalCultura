"use client";

import {
  Search,
  Plus,
  Users,
  Building2,
  ClipboardList,
  CalendarDays,
  ChevronRight,
  FileText,
  Inbox,
  FolderOpen,
  MapPin,
  Clock3,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

export default function HomePage() {
  return (
    <AppShell activo="Inicio">

      <header className="border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between px-6 py-4 md:px-8">
          <h1 className="text-xl font-bold text-slate-950">
            Inicio
          </h1>

          <a
            href="/registrar"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            <Plus size={18} />
            Registrar
          </a>
        </div>
      </header>

      <main className="min-h-[calc(100vh-65px)] bg-slate-300 px-5 py-6 text-slate-950 md:px-8">

        <div className="mx-auto max-w-[1500px]">

          {/* BUSCADOR */}
          <section className="rounded-2xl border border-slate-400 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3 rounded-xl border border-slate-400 bg-slate-100 px-4 py-3">

              <Search size={19} className="text-slate-700" />

              <input
                type="text"
                placeholder="Buscar personas, dependencias, eventos o registros..."
                className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-600"
              />

              <ChevronRight size={19} className="text-slate-700" />

            </div>
          </section>

          {/* RESUMEN */}
          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <TarjetaResumen
              titulo="Personal"
              valor="282"
              href="/personal"
              icono={Users}
            />

            <TarjetaResumen
              titulo="Dependencias"
              valor="33"
              href="/dependencias"
              icono={Building2}
            />

            <TarjetaResumen
              titulo="Pendientes activos"
              valor="1"
              href="/pendientes"
              icono={ClipboardList}
              naranja
            />

            <TarjetaResumen
              titulo="Eventos"
              valor="9"
              href="/agenda"
              icono={CalendarDays}
            />

          </section>

          {/* SEGUNDA FILA */}
          <section className="mt-5 grid gap-4 xl:grid-cols-3">

            {/* EVENTO */}
            <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={19} className="text-sky-700" />

                  <h2 className="font-bold text-slate-950">
                    Próximo evento
                  </h2>
                </div>

                <a
                  href="/agenda"
                  className="text-sm font-semibold text-sky-700"
                >
                  Ver agenda
                </a>
              </div>

              <div className="mt-4 rounded-xl border border-slate-400 bg-slate-100 p-4">

                <h3 className="font-bold text-slate-950">
                  Fiesta de Reyes
                </h3>

                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <CalendarDays size={15} />
                  05/01/2026
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <MapPin size={15} />
                  Predio
                </div>

              </div>

            </div>

            {/* REGISTROS */}
            <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">
                  <FileText size={19} className="text-sky-700" />

                  <h2 className="font-bold text-slate-950">
                    Registros recientes
                  </h2>
                </div>

                <a
                  href="/registros"
                  className="text-sm font-semibold text-sky-700"
                >
                  Ver todos
                </a>

              </div>

              <div className="mt-4 rounded-xl border border-slate-400 bg-slate-100 p-4">

                <p className="text-xs font-bold uppercase text-sky-700">
                  Reunión
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  Reunión con equipo del Centro Cultural
                </p>

                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Clock3 size={14} />
                  12/09/2026 · 05:58 p. m.
                </div>

              </div>

            </div>

            {/* BANDEJA */}
            <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">
                  <Inbox size={19} className="text-sky-700" />

                  <h2 className="font-bold text-slate-950">
                    Bandeja
                  </h2>
                </div>

                <a
                  href="/bandeja"
                  className="text-sm font-semibold text-sky-700"
                >
                  Ver bandeja
                </a>

              </div>

              <div className="flex min-h-32 items-center justify-center">
                <p className="text-sm font-medium text-slate-700">
                  Todavía no hay ingresos.
                </p>
              </div>

            </div>

          </section>

          {/* ACCESOS */}
          <section className="mt-5 grid gap-4 md:grid-cols-3">

            <Acceso
              titulo="Registrar información"
              texto="Texto, archivo, foto o audio"
              href="/registrar"
              icono={Plus}
            />

            <Acceso
              titulo="Documentos"
              texto="Archivos institucionales"
              href="/documentos"
              icono={FolderOpen}
            />

            <Acceso
              titulo="Bandeja"
              texto="Información recibida"
              href="/bandeja"
              icono={Inbox}
            />

          </section>

        </div>

      </main>

    </AppShell>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  href,
  icono: Icon,
  naranja = false,
}: {
  titulo: string;
  valor: string;
  href: string;
  icono: React.ElementType;
  naranja?: boolean;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-slate-400 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            naranja
              ? "bg-orange-100 text-orange-700"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          <Icon size={21} />
        </div>

        <ChevronRight
          size={19}
          className="text-slate-600 transition group-hover:text-slate-950"
        />

      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">
        {titulo}
      </p>

      <p className="mt-1 text-3xl font-bold text-slate-950">
        {valor}
      </p>
    </a>
  );
}

function Acceso({
  titulo,
  texto,
  href,
  icono: Icon,
}: {
  titulo: string;
  texto: string;
  href: string;
  icono: React.ElementType;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">

        <div>
          <h3 className="font-bold text-slate-950">
            {titulo}
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-700">
            {texto}
          </p>
        </div>

        <Icon size={20} className="text-sky-700" />

      </div>
    </a>
  );
}
