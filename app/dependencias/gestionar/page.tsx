"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Pencil,
  Plus,
  Save,
  Trash2,
  RotateCcw,
  X,
  Loader2,
} from "lucide-react";

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

const vacio = {
  nombre: "",
  area: "",
  responsable: "",
  descripcion: "",
  direccion: "",
  telefono: "",
  email: "",
};

function crearSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function GestionarDependenciasPage() {
  const supabase = createClient();

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);

    const { data, error } = await supabase
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
      .order("activa", { ascending: false })
      .order("nombre");

    if (error) {
      console.error(error);
      alert("No se pudieron cargar las dependencias.");
    }

    setDependencias(data || []);
    setCargando(false);
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      cargar();
    }

    iniciar();
  }, []);

  function cambiar(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function nueva() {
    setEditandoId(null);
    setForm(vacio);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function editar(dep: Dependencia) {
    setEditandoId(dep.id);

    setForm({
      nombre: dep.nombre || "",
      area: dep.area || "",
      responsable: dep.responsable || "",
      descripcion: dep.descripcion || "",
      direccion: dep.direccion || "",
      telefono: dep.telefono || "",
      email: dep.email || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(vacio);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    const nombre = form.nombre.trim();

    if (!nombre) {
      alert("El nombre de la dependencia es obligatorio.");
      return;
    }

    setGuardando(true);

    const slug = crearSlug(nombre);

    const { data: duplicada } = await supabase
      .from("dependencias")
      .select("id,nombre")
      .eq("slug", slug);

    const conflicto = (duplicada || []).some(
      (item) => item.id !== editandoId
    );

    if (conflicto) {
      setGuardando(false);

      alert(
        "Ya existe una dependencia con un nombre igual o muy parecido."
      );

      return;
    }

    const datos = {
      nombre,
      slug,

      area:
        form.area.trim() || null,

      responsable:
        form.responsable.trim() || null,

      descripcion:
        form.descripcion.trim() || null,

      direccion:
        form.direccion.trim() || null,

      telefono:
        form.telefono.trim() || null,

      email:
        form.email.trim() || null,

      activa: true,
    };

    let error;

    if (editandoId) {
      const respuesta = await supabase
        .from("dependencias")
        .update(datos)
        .eq("id", editandoId);

      error = respuesta.error;
    } else {
      const respuesta = await supabase
        .from("dependencias")
        .insert(datos);

      error = respuesta.error;
    }

    setGuardando(false);

    if (error) {
      console.error(error);
      alert("No se pudo guardar la dependencia.");
      return;
    }

    setEditandoId(null);
    setForm(vacio);

    await cargar();
  }

  async function eliminar(dep: Dependencia) {
    const confirmar = window.confirm(
      `¿Querés eliminar "${dep.nombre}" de las dependencias activas?\n\nNo se eliminará su personal ni su historial.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("dependencias")
      .update({
        activa: false,
      })
      .eq("id", dep.id);

    if (error) {
      console.error(error);
      alert("No se pudo eliminar la dependencia.");
      return;
    }

    await cargar();
  }

  async function restaurar(dep: Dependencia) {
    const { error } = await supabase
      .from("dependencias")
      .update({
        activa: true,
      })
      .eq("id", dep.id);

    if (error) {
      console.error(error);
      alert("No se pudo restaurar la dependencia.");
      return;
    }

    await cargar();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-7 text-slate-900">

      <div className="mx-auto max-w-6xl">

        <a
          href="/dependencias"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft size={18} />
          Volver a Dependencias
        </a>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold">
              Gestión de dependencias
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Agregar, modificar o eliminar espacios institucionales
            </p>
          </div>

          <button
            onClick={nueva}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f2b46] px-4 py-3 text-sm font-medium text-white"
          >
            <Plus size={18} />
            Nueva dependencia
          </button>

        </div>

        <form
          onSubmit={guardar}
          className="mb-7 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm"
        >

          <div className="mb-5 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <Building2 size={20} />
              </div>

              <h2 className="font-semibold">
                {editandoId
                  ? "Editar dependencia"
                  : "Nueva dependencia"}
              </h2>

            </div>

            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            )}

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <Campo
              label="Nombre *"
              value={form.nombre}
              onChange={(v) =>
                cambiar("nombre", v)
              }
            />

            <Campo
              label="Área"
              value={form.area}
              onChange={(v) =>
                cambiar("area", v)
              }
            />

            <Campo
              label="Responsable"
              value={form.responsable}
              onChange={(v) =>
                cambiar("responsable", v)
              }
            />

            <Campo
              label="Dirección"
              value={form.direccion}
              onChange={(v) =>
                cambiar("direccion", v)
              }
            />

            <Campo
              label="Teléfono"
              value={form.telefono}
              onChange={(v) =>
                cambiar("telefono", v)
              }
            />

            <Campo
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) =>
                cambiar("email", v)
              }
            />

          </div>

          <div className="mt-4">

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descripción
            </label>

            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) =>
                cambiar(
                  "descripcion",
                  e.target.value
                )
              }
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600"
            />

          </div>

          <div className="mt-5 flex justify-end">

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f2b46] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >

              {guardando ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {editandoId
                ? "Guardar cambios"
                : "Agregar dependencia"}

            </button>

          </div>

        </form>

        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">

          <h2 className="mb-5 text-lg font-semibold">
            Dependencias
          </h2>

          {cargando ? (
            <div className="flex justify-center p-10">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">

              {dependencias.map((dep) => (

                <div
                  key={dep.id}
                  className={`flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${
                    dep.activa
                      ? "border-slate-300 bg-white"
                      : "border-slate-200 bg-slate-100 opacity-60"
                  }`}
                >

                  <div>

                    <div className="flex items-center gap-2">

                      <h3 className="font-semibold">
                        {dep.nombre}
                      </h3>

                      {!dep.activa && (
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-600">
                          Eliminada
                        </span>
                      )}

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {dep.area || "Sin área"}
                    </p>

                    {dep.responsable && (
                      <p className="mt-1 text-sm text-slate-500">
                        Responsable: {dep.responsable}
                      </p>
                    )}

                  </div>

                  <div className="flex gap-2">

                    {dep.activa && (
                      <>
                        <button
                          onClick={() =>
                            editar(dep)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          onClick={() =>
                            eliminar(dep)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </>
                    )}

                    {!dep.activa && (
                      <button
                        onClick={() =>
                          restaurar(dep)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                      >
                        <RotateCcw size={16} />
                        Restaurar
                      </button>
                    )}

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600"
      />

    </div>
  );
}
