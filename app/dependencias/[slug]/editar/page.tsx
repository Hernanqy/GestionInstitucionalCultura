"use client";

import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  responsable: string | null;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  activa: boolean;
  slug: string | null;
};

export default function EditarDependenciaPage() {
  const params = useParams();
  const slug = String(params.slug || "");

  const supabase = createClient();

  const [dependencia, setDependencia] = useState<Dependencia | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      let consulta = await supabase
        .from("dependencias")
        .select(`
          id,
          nombre,
          area,
          responsable,
          descripcion,
          direccion,
          telefono,
          email,
          activa,
          slug
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (!consulta.data) {
        const { data: todas } = await supabase
          .from("dependencias")
          .select(`
            id,
            nombre,
            area,
            responsable,
            descripcion,
            direccion,
            telefono,
            email,
            activa,
            slug
          `);

        const encontrada = (todas || []).find((item) => {
          const calculado = item.nombre
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          return calculado === slug;
        });

        if (encontrada) {
          setDependencia(encontrada as Dependencia);
        }
      } else {
        setDependencia(consulta.data as Dependencia);
      }

      setCargando(false);
    }

    cargar();
  }, [slug]);

  function cambiar(
    campo: keyof Dependencia,
    valor: string | boolean
  ) {
    if (!dependencia) return;

    setDependencia({
      ...dependencia,
      [campo]: valor,
    });
  }

  async function guardar() {
    if (!dependencia) return;

    setGuardando(true);
    setMensaje("");

    const nuevoSlug = dependencia.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error } = await supabase
      .from("dependencias")
      .update({
        nombre: dependencia.nombre.trim(),
        area: dependencia.area?.trim() || null,
        responsable:
          dependencia.responsable?.trim() || null,
        descripcion:
          dependencia.descripcion?.trim() || null,
        direccion:
          dependencia.direccion?.trim() || null,
        telefono:
          dependencia.telefono?.trim() || null,
        email:
          dependencia.email?.trim() || null,
        activa: dependencia.activa,
        slug: nuevoSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dependencia.id);

    if (error) {
      console.error(error);
      setMensaje("No se pudieron guardar los cambios.");
      setGuardando(false);
      return;
    }

    setMensaje("Cambios guardados correctamente.");
    setGuardando(false);

    if (nuevoSlug !== slug) {
      setTimeout(() => {
        window.location.href =
          `/dependencias/${nuevoSlug}`;
      }, 700);
    }
  }

  if (cargando) {
    return (
      <AppShell activo="Dependencias">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2
            size={24}
            className="animate-spin"
          />
        </div>
      </AppShell>
    );
  }

  if (!dependencia) {
    return (
      <AppShell activo="Dependencias">
        <div className="p-8">
          No se encontró la dependencia.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activo="Dependencias">

      <header className="border-b border-slate-400 bg-white">

        <div className="flex items-center justify-between px-5 py-4 md:px-8">

          <a
            href={`/dependencias/${slug}`}
            className="flex items-center gap-2 text-sm text-slate-950"
          >
            <ArrowLeft size={17} />
            Volver
          </a>

          <button
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {guardando ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            Guardar
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">

        {mensaje && (
          <div className="mb-5 rounded-xl border border-slate-400 bg-white px-4 py-3 text-sm">
            {mensaje}
          </div>
        )}

        <section className="rounded-2xl border border-slate-400 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-xl font-semibold">
                Editar dependencia
              </h1>

              <p className="text-sm text-slate-950">
                Información institucional
              </p>
            </div>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <Campo titulo="Nombre">
              <input
                value={dependencia.nombre}
                onChange={(e) =>
                  cambiar("nombre", e.target.value)
                }
                className="campo"
              />
            </Campo>

            <Campo titulo="Área">
              <input
                value={dependencia.area || ""}
                onChange={(e) =>
                  cambiar("area", e.target.value)
                }
                className="campo"
              />
            </Campo>

            <Campo titulo="Responsable">
              <input
                value={dependencia.responsable || ""}
                onChange={(e) =>
                  cambiar(
                    "responsable",
                    e.target.value
                  )
                }
                className="campo"
              />
            </Campo>

            <Campo titulo="Teléfono">
              <input
                value={dependencia.telefono || ""}
                onChange={(e) =>
                  cambiar(
                    "telefono",
                    e.target.value
                  )
                }
                className="campo"
              />
            </Campo>

            <Campo titulo="Email">
              <input
                value={dependencia.email || ""}
                onChange={(e) =>
                  cambiar("email", e.target.value)
                }
                className="campo"
              />
            </Campo>

            <Campo titulo="Dirección">
              <input
                value={dependencia.direccion || ""}
                onChange={(e) =>
                  cambiar(
                    "direccion",
                    e.target.value
                  )
                }
                className="campo"
              />
            </Campo>

          </div>

          <div className="mt-4">

            <Campo titulo="Descripción">

              <textarea
                value={dependencia.descripcion || ""}
                onChange={(e) =>
                  cambiar(
                    "descripcion",
                    e.target.value
                  )
                }
                rows={6}
                className="campo"
              />

            </Campo>

          </div>

          <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-400 bg-slate-100 p-4">

            <input
              type="checkbox"
              checked={dependencia.activa}
              onChange={(e) =>
                cambiar(
                  "activa",
                  e.target.checked
                )
              }
              className="h-4 w-4"
            />

            <div>
              <p className="text-sm font-medium">
                Dependencia activa
              </p>

              <p className="text-xs text-slate-950">
                Si se desactiva, dejará de aparecer en los listados principales.
              </p>
            </div>

          </label>

        </section>

      </div>

      <style jsx global>{`
        .campo {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.75rem;
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .campo:focus {
          border-color: rgb(8 145 178);
        }
      `}</style>

    </AppShell>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-1 block text-sm font-medium text-slate-950">
        {titulo}
      </label>

      {children}

    </div>
  );
}


