"use client";

import {
  ArrowLeft,
  Inbox,
  Mic,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Building2,
  Loader2,
  GitBranch,
} from "lucide-react";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Ingreso = {
  id: string;
  tipo_fuente: string;
  titulo: string | null;
  contenido_original: string | null;
  resumen: string | null;
  estado: string;
  created_at: string;

  dependencia: {
    nombre: string;
  } | null;
};

type Accion = {
  id: string;
  tipo_accion: string;
  entidad: string;
  entidad_id: string | null;
  titulo: string | null;
  resumen: string | null;
  confianza: number | null;
  requiere_revision: boolean;
  estado: string;
  created_at: string;
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

function iconoFuente(tipo: string) {
  if (tipo === "audio") return Mic;
  if (tipo === "foto") return ImageIcon;
  if (tipo === "chat") return MessageSquare;

  return FileText;
}

function etiquetaAccion(tipo: string) {
  const mapa: Record<string, string> = {
    crear_registro: "Registro creado",
    crear_pendiente: "Pendiente creado",
    crear_evento: "Evento creado",
    actualizar_persona: "Persona actualizada",
    actualizar_dependencia: "Dependencia actualizada",
    crear_documento: "Documento creado",
  };

  return mapa[tipo] || tipo;
}

export default function IngresoDetallePage() {
  const params = useParams();
  const id = String(params.id || "");

  const supabase = createClient();

  const [ingreso, setIngreso] = useState<Ingreso | null>(null);
  const [acciones, setAcciones] = useState<Accion[]>([]);
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

      const { data: ingresoData } = await supabase
        .from("ingresos")
        .select(`
          id,
          tipo_fuente,
          titulo,
          contenido_original,
          resumen,
          estado,
          created_at,
          dependencia:dependencias(
            nombre
          )
        `)
        .eq("id", id)
        .single();

      if (ingresoData) {
        setIngreso(
          ingresoData as unknown as Ingreso
        );
      }

      const { data: accionesData } = await supabase
        .from("acciones_ingreso")
        .select(`
          id,
          tipo_accion,
          entidad,
          entidad_id,
          titulo,
          resumen,
          confianza,
          requiere_revision,
          estado,
          created_at
        `)
        .eq("ingreso_id", id)
        .order("created_at", {
          ascending: true,
        });

      setAcciones(
        (accionesData || []) as unknown as Accion[]
      );

      setCargando(false);
    }

    cargar();
  }, [id]);

  if (cargando) {
    return (
      <AppShell activo="Bandeja">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2
            size={24}
            className="animate-spin"
          />
        </div>
      </AppShell>
    );
  }

  if (!ingreso) {
    return (
      <AppShell activo="Bandeja">
        <div className="p-8">
          No se encontró el ingreso.
        </div>
      </AppShell>
    );
  }

  const Icon = iconoFuente(
    ingreso.tipo_fuente
  );

  return (
    <AppShell activo="Bandeja">

      <header className="border-b border-slate-400 bg-white">

        <div className="px-5 py-4 md:px-8">

          <a
            href="/bandeja"
            className="inline-flex items-center gap-2 text-sm text-black"
          >
            <ArrowLeft size={17} />
            Bandeja
          </a>

        </div>

      </header>

      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">

        <section className="rounded-2xl border border-slate-400 bg-white p-6 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">

              <Icon size={26} />

            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-semibold uppercase text-sky-700">
                {ingreso.tipo_fuente}
              </p>

              <h1 className="mt-1 text-xl font-semibold">
                {ingreso.titulo ||
                  "Ingreso sin título"}
              </h1>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-black">

                <span className="flex items-center gap-1">
                  <Clock3 size={13} />
                  {fecha(ingreso.created_at)}
                </span>

                {ingreso.dependencia?.nombre && (
                  <span className="flex items-center gap-1">
                    <Building2 size={13} />
                    {ingreso.dependencia.nombre}
                  </span>
                )}

              </div>

            </div>

          </div>

          {ingreso.resumen && (
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-100 p-4">

              <p className="text-xs font-semibold uppercase text-sky-700">
                Resumen
              </p>

              <p className="mt-2 text-sm leading-6 text-black">
                {ingreso.resumen}
              </p>

            </div>
          )}

          {ingreso.contenido_original && (
            <div className="mt-4 rounded-xl border border-slate-400 bg-slate-100 p-4">

              <p className="text-xs font-semibold uppercase text-black">
                Contenido original
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black">
                {ingreso.contenido_original}
              </p>

            </div>
          )}

        </section>

        <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <GitBranch
              size={20}
              className="text-sky-700"
            />

            <div>

              <h2 className="font-semibold">
                Acciones generadas
              </h2>

              <p className="text-sm text-black">
                {acciones.length} acciones derivadas
              </p>

            </div>

          </div>

          {acciones.length > 0 ? (
            <div className="mt-5 space-y-3">

              {acciones.map((accion) => (
                <div
                  key={accion.id}
                  className="rounded-xl border border-slate-400 bg-slate-100 p-4"
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <p className="text-xs font-semibold uppercase text-sky-700">
                        {etiquetaAccion(
                          accion.tipo_accion
                        )}
                      </p>

                      <h3 className="mt-1 font-semibold">
                        {accion.titulo ||
                          accion.entidad}
                      </h3>

                    </div>

                    {accion.requiere_revision ? (
                      <span className="flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">

                        <AlertCircle size={13} />

                        Revisar

                      </span>
                    ) : (
                      <span className="flex w-fit items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">

                        <CheckCircle2 size={13} />

                        Aplicada

                      </span>
                    )}

                  </div>

                  {accion.resumen && (
                    <p className="mt-3 text-sm leading-6 text-black">
                      {accion.resumen}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-black">

                    <span>
                      Destino: {accion.entidad}
                    </span>

                    {accion.confianza !== null && (
                      <span>
                        Confianza:{" "}
                        {Math.round(
                          accion.confianza * 100
                        )}
                        %
                      </span>
                    )}

                    <span>
                      {fecha(
                        accion.created_at
                      )}
                    </span>

                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-400 bg-slate-100 p-8 text-center">

              <Inbox
                className="mx-auto text-black"
              />

              <p className="mt-3 text-sm text-black">
                Este ingreso todavía no generó acciones.
              </p>

            </div>
          )}

        </section>

      </div>

    </AppShell>
  );
}



