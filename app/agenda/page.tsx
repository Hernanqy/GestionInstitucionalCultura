"use client";

import {
  CalendarDays,
  MapPin,
  Building2,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  estado: string | null;

  dependencia: {
    nombre: string;
  } | null;
};

function fecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  const [a, m, d] = fecha.split("-");

  return `${d}/${m}/${a}`;
}

export default function AgendaPage() {
  const supabase = createClient();

  const [eventos, setEventos] = useState<Evento[]>([]);
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

      const { data, error } = await supabase
        .from("eventos")
        .select(`
          id,
          nombre,
          fecha,
          hora,
          lugar,
          estado,
          dependencia:dependencias(nombre)
        `)
        .order("fecha", {
          ascending: true,
          nullsFirst: false,
        });

      if (!error) {
        setEventos((data || []) as Evento[]);
      }

      setCargando(false);
    }

    cargar();
  }, []);

  return (
    <AppShell activo="Agenda">

      <header className="border-b border-slate-300 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold">
            Agenda
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">
            <CalendarDays className="text-cyan-700" />
            <div>
              <h2 className="font-semibold">
                Eventos
              </h2>

              <p className="text-sm text-slate-500">
                {eventos.length} cargados
              </p>
            </div>
          </div>

          {cargando ? (
            <div className="flex min-h-60 items-center justify-center">
              <Loader2
                className="animate-spin"
                size={24}
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">

              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="rounded-xl border border-slate-300 bg-slate-50 p-4"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>

                      <h3 className="font-semibold">
                        {evento.nombre}
                      </h3>

                      <p className="mt-2 text-sm text-slate-700">
                        {fecha(evento.fecha)}
                        {evento.hora
                          ? ` · ${evento.hora.slice(0, 5)}`
                          : ""}
                      </p>

                      {evento.lugar && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <MapPin size={15} />
                          {evento.lugar}
                        </div>
                      )}

                      {evento.dependencia?.nombre && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Building2 size={15} />
                          {evento.dependencia.nombre}
                        </div>
                      )}

                    </div>

                    <span className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
                      {evento.estado || "pendiente"}
                    </span>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

    </AppShell>
  );
}
