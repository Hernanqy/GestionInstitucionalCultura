"use client";

import {
  History,
  Loader2,
  ArrowRight,
} from "lucide-react";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Cambio = {
  id: string;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  created_at: string;
};

const nombres: Record<string, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  legajo: "Legajo",
  area: "Área",
  cargo: "Cargo",
  funcion: "Función",
  tipo_contratacion: "Contratación",
  categoria: "Categoría",
  horas: "Horas",
  telefono: "Teléfono",
  email: "Email",
  direccion: "Dirección",
  contacto_emergencia: "Contacto de emergencia",
  telefono_emergencia: "Teléfono de emergencia",
  observaciones: "Observaciones",
  tareas_especificas: "Tareas específicas",
  descripcion_tareas: "Descripción de tareas",
  vencimiento: "Vencimiento",
  responsable: "Responsable",
  descripcion: "Descripción",
  activa: "Estado",
  dependencia_id: "Dependencia",
};

function fecha(valor: string) {
  return new Date(valor).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function valorTexto(valor: string | null) {
  if (!valor) return "Sin dato";

  if (valor === "true") return "Sí";
  if (valor === "false") return "No";

  return valor;
}

export default function HistorialCambios({
  entidad,
  entidadId,
}: {
  entidad: "personas" | "dependencias";
  entidadId: string;
}) {
  const supabase = createClient();

  const [cambios, setCambios] = useState<Cambio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from("historial_cambios")
        .select(`
          id,
          campo,
          valor_anterior,
          valor_nuevo,
          created_at
        `)
        .eq("entidad", entidad)
        .eq("entidad_id", entidadId)
        .order("created_at", {
          ascending: false,
        })
        .limit(50);

      if (!error) {
        setCambios(data || []);
      }

      setCargando(false);
    }

    cargar();
  }, [entidad, entidadId]);

  return (
    <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <History
          size={20}
          className="text-cyan-700"
        />

        <div>
          <h2 className="font-semibold">
            Historial de cambios
          </h2>

          <p className="text-sm text-slate-500">
            Últimas modificaciones registradas
          </p>
        </div>

      </div>

      {cargando ? (
        <div className="flex min-h-32 items-center justify-center">
          <Loader2
            size={20}
            className="animate-spin"
          />
        </div>
      ) : cambios.length > 0 ? (
        <div className="mt-4 space-y-3">

          {cambios.map((cambio) => (
            <div
              key={cambio.id}
              className="rounded-xl border border-slate-300 bg-slate-50 p-4"
            >

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm font-semibold">
                  {nombres[cambio.campo] || cambio.campo}
                </p>

                <p className="text-xs text-slate-400">
                  {fecha(cambio.created_at)}
                </p>

              </div>

              <div className="mt-3 flex flex-col gap-2 text-sm md:flex-row md:items-center">

                <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-500">
                  {valorTexto(
                    cambio.valor_anterior
                  )}
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-slate-400"
                />

                <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-slate-700">
                  {valorTexto(
                    cambio.valor_nuevo
                  )}
                </div>

              </div>

            </div>
          ))}

        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
          <p className="text-sm text-slate-400">
            Todavía no hay modificaciones registradas.
          </p>
        </div>
      )}

    </section>
  );
}
