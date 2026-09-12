"use client";

import {
  Users,
  Building2,
  ClipboardList,
  CalendarDays,
  FileText,
  Inbox,
  Search,
  Plus,
  ChevronRight,
  Clock3,
  MapPin,
  Loader2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
};

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
  created_at: string;
};

type Ingreso = {
  id: string;
  titulo: string | null;
  tipo_fuente: string;
  estado: string;
  created_at: string;
};

type Totales = {
  personal: number;
  dependencias: number;
  pendientes: number;
  eventos: number;
};

function formatearFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  const [anio, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha: string) {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const supabase = createClient();

  const [totales, setTotales] = useState<Totales>({
    personal: 0,
    dependencias: 0,
    pendientes: 0,
    eventos: 0,
  });

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const [
        personalRes,
        dependenciasRes,
        pendientesRes,
        eventosCountRes,
        eventosRes,
        registrosRes,
        ingresosRes,
      ] = await Promise.all([
        supabase
          .from("personas")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("activo", true),

        supabase
          .from("dependencias")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("activa", true),

        supabase
          .from("pendientes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("completado", false),

        supabase
          .from("eventos")
          .select("*", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("eventos")
          .select(`
            id,
            nombre,
            fecha,
            hora,
            lugar
          `)
          .not("fecha", "is", null)
          .order("fecha", {
            ascending: true,
          })
          .limit(5),

        supabase
          .from("registros")
          .select(`
            id,
            titulo,
            contenido,
            tipo,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("ingresos")
          .select(`
            id,
            titulo,
            tipo_fuente,
            estado,
            created_at
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(5),
      ]);

      setTotales({
        personal: personalRes.count || 0,
        dependencias: dependenciasRes.count || 0,
        pendientes: pendientesRes.count || 0,
        eventos: eventosCountRes.count || 0,
      });

      setEventos(eventosRes.data || []);
      setRegistros(registrosRes.data || []);
      setIngresos(ingresosRes.data || []);

      setCargando(false);
    }

    cargar();
  }, []);

  const proximoEvento = useMemo(() => {
    if (eventos.length === 0) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const futuros = eventos.filter((evento) => {
      if (!evento.fecha) return false;

      const fecha = new Date(`${evento.fecha}T00:00:00`);

      return fecha >= hoy;
    });

    return futuros[0] || eventos[0];
  }, [eventos]);

  if (cargando) {
    return (
      <AppShell activo="Inicio">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Cargando gestión...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activo="Inicio">

      <header className="border-b border-slate-300 bg-white">

        <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">

          <div>
            <h1 className="text-xl font-semibold">
              Inicio
            </h1>
          </div>

          <a
            href="/registrar"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f2b46] px-4 py-3 text-sm font-semibold text-white"
          >
            <Plus size={18} />
            Registrar
          </a>

        </div>

      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8">

        <section className="rounded-2xl border border-slate-400 bg-white p-4 shadow-sm">

          <a
            href="/buscar"
            className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
          >

            <Search
              size={19}
              className="text-slate-500"
            />

            <span className="flex-1 text-sm text-slate-500">
              Buscar personas, dependencias, eventos o registros...
            </span>

            <ChevronRight
              size={18}
              className="text-slate-400"
            />

          </a>

        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <a
            href="/personal"
            className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Users size={21} />
              </div>

              <ChevronRight
                size={18}
                className="text-slate-400"
              />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Personal
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {totales.personal}
            </p>

          </a>

          <a
            href="/dependencias"
            className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Building2 size={21} />
              </div>

              <ChevronRight
                size={18}
                className="text-slate-400"
              />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Dependencias
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {totales.dependencias}
            </p>

          </a>

          <a
            href="/pendientes"
            className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <ClipboardList size={21} />
              </div>

              <ChevronRight
                size={18}
                className="text-slate-400"
              />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Pendientes activos
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {totales.pendientes}
            </p>

          </a>

          <a
            href="/agenda"
            className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <CalendarDays size={21} />
              </div>

              <ChevronRight
                size={18}
                className="text-slate-400"
              />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              Eventos
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {totales.eventos}
            </p>

          </a>

        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-3">

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <CalendarDays
                  size={20}
                  className="text-cyan-700"
                />

                <h2 className="font-semibold">
                  Próximo evento
                </h2>

              </div>

              <a
                href="/agenda"
                className="text-sm text-cyan-700"
              >
                Ver agenda
              </a>

            </div>

            {proximoEvento ? (
              <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4">

                <h3 className="font-semibold">
                  {proximoEvento.nombre}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {formatearFecha(
                    proximoEvento.fecha
                  )}
                  {proximoEvento.hora
                    ? ` · ${proximoEvento.hora.slice(
                        0,
                        5
                      )}`
                    : ""}
                </p>

                {proximoEvento.lugar && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                    <MapPin size={15} />

                    {proximoEvento.lugar}

                  </div>
                )}

              </div>
            ) : (
              <div className="mt-5 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">

                <p className="text-sm text-slate-400">
                  No hay eventos cargados.
                </p>

              </div>
            )}

          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <FileText
                  size={20}
                  className="text-cyan-700"
                />

                <h2 className="font-semibold">
                  Registros recientes
                </h2>

              </div>

              <a
                href="/registros"
                className="text-sm text-cyan-700"
              >
                Ver todos
              </a>

            </div>

            <div className="mt-4 space-y-2">

              {registros.length > 0 ? (
                registros.map((registro) => (
                  <div
                    key={registro.id}
                    className="rounded-xl border border-slate-300 bg-slate-50 p-3"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold uppercase text-cyan-700">
                          {registro.tipo ||
                            "Registro"}
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {registro.titulo ||
                            "Sin título"}
                        </p>

                      </div>

                      <Clock3
                        size={14}
                        className="mt-1 shrink-0 text-slate-400"
                      />

                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatearFechaHora(
                        registro.created_at
                      )}
                    </p>

                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  Sin registros recientes.
                </p>
              )}

            </div>

          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Inbox
                  size={20}
                  className="text-cyan-700"
                />

                <h2 className="font-semibold">
                  Bandeja
                </h2>

              </div>

              <a
                href="/bandeja"
                className="text-sm text-cyan-700"
              >
                Ver bandeja
              </a>

            </div>

            <div className="mt-4 space-y-2">

              {ingresos.length > 0 ? (
                ingresos.map((ingreso) => (
                  <div
                    key={ingreso.id}
                    className="rounded-xl border border-slate-300 bg-slate-50 p-3"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs font-semibold uppercase text-cyan-700">
                          {ingreso.tipo_fuente}
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {ingreso.titulo ||
                            "Ingreso sin título"}
                        </p>

                      </div>

                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                          ingreso.estado ===
                          "procesado"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : ingreso.estado ===
                              "requiere_revision"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-300 bg-white text-slate-600"
                        }`}
                      >
                        {ingreso.estado}
                      </span>

                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatearFechaHora(
                        ingreso.created_at
                      )}
                    </p>

                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  Todavía no hay ingresos.
                </p>
              )}

            </div>

          </div>

        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">

          <a
            href="/registrar"
            className="flex items-center justify-between rounded-2xl border border-slate-400 bg-white p-5 shadow-sm"
          >

            <div>
              <p className="font-semibold">
                Registrar información
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Texto, archivo, foto o audio
              </p>
            </div>

            <Plus
              size={20}
              className="text-cyan-700"
            />

          </a>

          <a
            href="/documentos"
            className="flex items-center justify-between rounded-2xl border border-slate-400 bg-white p-5 shadow-sm"
          >

            <div>
              <p className="font-semibold">
                Documentos
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Archivos institucionales
              </p>
            </div>

            <FileText
              size={20}
              className="text-cyan-700"
            />

          </a>

          <a
            href="/bandeja"
            className="flex items-center justify-between rounded-2xl border border-slate-400 bg-white p-5 shadow-sm"
          >

            <div>
              <p className="font-semibold">
                Bandeja
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Información recibida
              </p>
            </div>

            <Inbox
              size={20}
              className="text-cyan-700"
            />

          </a>

        </section>

      </div>

    </AppShell>
  );
}
