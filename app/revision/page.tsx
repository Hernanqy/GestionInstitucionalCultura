"use client";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ClipboardCheck,
  Clock3,
  Inbox,
} from "lucide-react";

import { useEffect, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Accion = {
  id: string;
  ingreso_id: string;
  tipo_accion: string;
  entidad: string;
  entidad_id: string | null;
  titulo: string | null;
  resumen: string | null;
  datos: Record<string, any> | null;
  confianza: number | null;
  requiere_revision: boolean;
  estado: string;
  created_at: string;

  ingreso: {
    titulo: string | null;
    tipo_fuente: string;
  } | null;
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

export default function RevisionPage() {
  const supabase = createClient();

  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);

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
      .from("acciones_ingreso")
      .select(`
        id,
        ingreso_id,
        tipo_accion,
        entidad,
        entidad_id,
        titulo,
        resumen,
        datos,
        confianza,
        requiere_revision,
        estado,
        created_at,
        ingreso:ingresos(
          titulo,
          tipo_fuente
        )
      `)
      .eq("requiere_revision", true)
      .eq("estado", "pendiente")
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setAcciones(
        (data || []) as unknown as Accion[]
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function aprobar(accion: Accion) {
    setProcesando(accion.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProcesando(null);
      return;
    }

    let entidadId = accion.entidad_id;

    try {

      if (
        accion.tipo_accion === "crear_registro" &&
        accion.datos
      ) {
        const { data, error } = await supabase
          .from("registros")
          .insert({
            ...accion.datos,
            origen_ingreso_id: accion.ingreso_id,
          })
          .select("id")
          .single();

        if (error) throw error;

        entidadId = data.id;
      }

      if (
        accion.tipo_accion === "crear_pendiente" &&
        accion.datos
      ) {
        const { data, error } = await supabase
          .from("pendientes")
          .insert({
            ...accion.datos,
            origen_ingreso_id: accion.ingreso_id,
          })
          .select("id")
          .single();

        if (error) throw error;

        entidadId = data.id;
      }

      if (
        accion.tipo_accion === "crear_evento" &&
        accion.datos
      ) {
        const { data, error } = await supabase
          .from("eventos")
          .insert({
            ...accion.datos,
            origen_ingreso_id: accion.ingreso_id,
          })
          .select("id")
          .single();

        if (error) throw error;

        entidadId = data.id;
      }

      if (
        accion.tipo_accion === "actualizar_persona" &&
        accion.entidad_id &&
        accion.datos
      ) {
        const { error } = await supabase
          .from("personas")
          .update({
            ...accion.datos,
            updated_at: new Date().toISOString(),
          })
          .eq("id", accion.entidad_id);

        if (error) throw error;
      }

      if (
        accion.tipo_accion === "actualizar_dependencia" &&
        accion.entidad_id &&
        accion.datos
      ) {
        const { error } = await supabase
          .from("dependencias")
          .update({
            ...accion.datos,
            updated_at: new Date().toISOString(),
          })
          .eq("id", accion.entidad_id);

        if (error) throw error;
      }

      const { error: errorAccion } = await supabase
        .from("acciones_ingreso")
        .update({
          estado: "aplicada",
          requiere_revision: false,
          entidad_id: entidadId,
          revisado_at: new Date().toISOString(),
          revisado_por: user.id,
        })
        .eq("id", accion.id);

      if (errorAccion) {
        throw errorAccion;
      }

      await cargar();

    } catch (error) {
      console.error(error);
      alert("No se pudo aplicar la acción.");
    }

    setProcesando(null);
  }

  async function descartar(accion: Accion) {
    const confirmar = window.confirm(
      "¿Descartar esta acción?"
    );

    if (!confirmar) return;

    setProcesando(accion.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProcesando(null);
      return;
    }

    await supabase
      .from("acciones_ingreso")
      .update({
        estado: "descartada",
        requiere_revision: false,
        revisado_at: new Date().toISOString(),
        revisado_por: user.id,
      })
      .eq("id", accion.id);

    await cargar();

    setProcesando(null);
  }

  return (
    <AppShell activo="Revisión">

      <header className="border-b border-slate-400 bg-white">
        <div className="px-5 py-4 md:px-8">

          <h1 className="text-xl font-semibold">
            Centro de revisión
          </h1>

        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <section className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <ClipboardCheck
              size={22}
              className="text-sky-700"
            />

            <div>

              <h2 className="font-semibold">
                Acciones que requieren confirmación
              </h2>

              <p className="text-sm text-slate-950">
                Solo aparecen interpretaciones que no conviene aplicar automáticamente.
              </p>

            </div>

          </div>

        </section>

        {cargando ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2
              size={24}
              className="animate-spin"
            />
          </div>
        ) : acciones.length > 0 ? (
          <section className="mt-5 space-y-4">

            {acciones.map((accion) => (

              <div
                key={accion.id}
                className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                      <AlertTriangle
                        size={17}
                        className="text-amber-600"
                      />

                      <p className="text-xs font-semibold uppercase text-amber-700">
                        Requiere revisión
                      </p>

                    </div>

                    <h2 className="mt-2 text-lg font-semibold">
                      {accion.titulo ||
                        accion.tipo_accion}
                    </h2>

                    {accion.resumen && (
                      <p className="mt-2 text-sm leading-6 text-slate-950">
                        {accion.resumen}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-950">

                      <span>
                        Acción: {accion.tipo_accion}
                      </span>

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

                    </div>

                    {accion.ingreso && (
                      <a
                        href={`/bandeja/${accion.ingreso_id}`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700"
                      >
                        <Inbox size={15} />
                        Ver ingreso original
                      </a>
                    )}

                    <div className="mt-3 flex items-center gap-1 text-xs text-slate-950">
                      <Clock3 size={13} />
                      {fecha(accion.created_at)}
                    </div>

                  </div>

                  <div className="flex shrink-0 gap-2">

                    <button
                      onClick={() =>
                        descartar(accion)
                      }
                      disabled={
                        procesando === accion.id
                      }
                      className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Descartar
                    </button>

                    <button
                      onClick={() =>
                        aprobar(accion)
                      }
                      disabled={
                        procesando === accion.id
                      }
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {procesando === accion.id ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2 size={17} />
                      )}

                      Aprobar
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </section>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-400 bg-white p-12 text-center">

            <CheckCircle2
              size={30}
              className="mx-auto text-green-600"
            />

            <h2 className="mt-3 font-semibold">
              No hay revisiones pendientes
            </h2>

            <p className="mt-1 text-sm text-slate-950">
              Todo está al día.
            </p>

          </div>
        )}

      </div>

    </AppShell>
  );
}


