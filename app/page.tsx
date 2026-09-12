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
} from "lucide-react";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  lugar: string | null;
};

export default function HomePage() {
  const supabase = createClient();

  const [personal, setPersonal] = useState(0);
  const [dependencias, setDependencias] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [eventos, setEventos] = useState(0);
  const [proximoEvento, setProximoEvento] = useState<Evento | null>(null);

  useEffect(() => {
    async function cargar() {
      const hoy = new Date().toISOString().split("T")[0];

      const [
        personalResp,
        dependenciasResp,
        pendientesResp,
        eventosResp,
        proximoResp,
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
          .select("*", { count: "exact", head: true })
          .gte("fecha", hoy),

        supabase
          .from("eventos")
          .select("id,nombre,fecha,lugar")
          .gte("fecha", hoy)
          .order("fecha", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      setPersonal(personalResp.count || 0);
      setDependencias(dependenciasResp.count || 0);
      setPendientes(pendientesResp.count || 0);
      setEventos(eventosResp.count || 0);

      if (proximoResp.data) {
        setProximoEvento(proximoResp.data);
      }
    }

    cargar();
  }, []);

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

          <section className="rounded-2xl border border-slate-400 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3 rounded-xl border border-slate-400 bg-slate-100 px-4 py-3">

              <Search size={19} className="text-slate-950" />

              <input
                type="text"
                placeholder="Buscar personas, dependencias, eventos o registros..."
                className="w-full bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-950"
              />

              <ChevronRight size={19} className="text-slate-950" />

            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <TarjetaResumen
              titulo="Personal"
              valor={personal}
              href="/personal"
              icono={Users}
            />

            <TarjetaResumen
              titulo="Dependencias"
              valor={dependencias}
              href="/dependencias"
              icono={Building2}
            />

            <TarjetaResumen
              titulo="Pendientes activos"
              valor={pendientes}
              href="/pendientes"
              icono={ClipboardList}
              naranja
            />

            <TarjetaResumen
              titulo="Eventos próximos"
              valor={eventos}
              href="/agenda"
              icono={CalendarDays}
            />

          </section>

          <section className="mt-5 grid gap-4 xl:grid-cols-3">

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

              {proximoEvento ? (
                <div className="mt-4 rounded-xl border border-slate-400 bg-slate-100 p-4">

                  <h3 className="font-bold text-slate-950">
                    {proximoEvento.nombre}
                  </h3>

                  {proximoEvento.fecha && (
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-950">
                      <CalendarDays size={15} />
                      {new Date(
                        `${proximoEvento.fecha}T12:00:00`
                      ).toLocaleDateString("es-AR")}
                    </div>
                  )}

                  {proximoEvento.lugar && (
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-950">
                      <MapPin size={15} />
                      {proximoEvento.lugar}
                    </div>
                  )}

                </div>
              ) : (
                <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-100">

                  <p className="text-sm font-medium text-slate-950">
                    No hay eventos futuros cargados.
                  </p>

                </div>
              )}

            </div>

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

              <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-100">

                <p className="text-sm font-medium text-slate-950">
                  No hay registros cargados.
                </p>

              </div>

            </div>

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

                <p className="text-sm font-medium text-slate-950">
                  Todavía no hay ingresos.
                </p>

              </div>

            </div>

          </section>

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
  valor: number;
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
          className="text-slate-950 transition group-hover:text-slate-950"
        />

      </div>

      <p className="mt-4 text-sm font-semibold text-slate-950">
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

          <p className="mt-1 text-sm font-medium text-slate-950">
            {texto}
          </p>

        </div>

        <Icon size={20} className="text-sky-700" />

      </div>

    </a>
  );
}

