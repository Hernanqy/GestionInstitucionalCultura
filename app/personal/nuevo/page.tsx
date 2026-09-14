"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
};

export default function NuevoPersonalPage() {
  const supabase = createClient();
  const router = useRouter();

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    legajo: "",
    dependencia_id: "",
    cargo: "",
    funcion: "",
    tipo_contratacion: "",
    categoria: "",
    horas: "",
    telefono: "",
    email: "",
    fecha_ingreso: "",
    observaciones: "",
  });

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("dependencias")
        .select("id,nombre,area")
        .eq("activa", true)
        .order("nombre");

      if (error) {
        console.error(error);

        setMensaje({
          tipo: "error",
          texto: "No se pudieron cargar las dependencias.",
        });
      } else {
        setDependencias(data || []);
      }

      setCargando(false);
    }

    iniciar();
  }, []);

  function actualizar(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    setMensaje(null);

    if (!form.nombre.trim()) {
      setMensaje({
        tipo: "error",
        texto: "El nombre es obligatorio.",
      });

      return;
    }

    setGuardando(true);

    // Si hay legajo, evitar duplicados
    if (form.legajo.trim()) {
      const { data: existente } = await supabase
        .from("personas")
        .select("id,nombre,apellido")
        .eq("legajo", form.legajo.trim())
        .limit(1);

      if (existente && existente.length > 0) {
        setMensaje({
          tipo: "error",
          texto: "Ya existe una persona con ese legajo.",
        });

        setGuardando(false);
        return;
      }
    }

    const dependenciaSeleccionada =
      dependencias.find(
        (d) => d.id === form.dependencia_id
      );

    const { error } = await supabase
      .from("personas")
      .insert({
        nombre: form.nombre.trim(),

        apellido:
          form.apellido.trim() || null,

        legajo:
          form.legajo.trim() || null,

        dependencia_id:
          form.dependencia_id || null,

        area:
          dependenciaSeleccionada?.area || null,

        cargo:
          form.cargo.trim() || null,

        funcion:
          form.funcion.trim() || null,

        tipo_contratacion:
          form.tipo_contratacion || null,

        categoria:
          form.categoria.trim() || null,

        horas:
          form.horas.trim() || null,

        telefono:
          form.telefono.trim() || null,

        email:
          form.email.trim() || null,

        fecha_ingreso:
          form.fecha_ingreso || null,

        observaciones:
          form.observaciones.trim() || null,

        activo: true,

        fuente: "alta_app",
      });

    if (error) {
      console.error(error);

      setMensaje({
        tipo: "error",
        texto: "No se pudo guardar la persona.",
      });

      setGuardando(false);
      return;
    }

    setMensaje({
      tipo: "ok",
      texto: "Personal agregado correctamente.",
    });

    setGuardando(false);

    setTimeout(() => {
      router.push("/personal");
      router.refresh();
    }, 800);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2
            size={20}
            className="animate-spin"
          />

          Cargando...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 md:px-8">

      <div className="mx-auto max-w-5xl">

        <a
          href="/personal"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Volver a Personal
        </a>

        <div className="rounded-2xl border border-slate-300 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <UserPlus size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">
                  Nuevo personal
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Incorporar una persona a la base institucional
                </p>
              </div>

            </div>

          </div>

          <form
            onSubmit={guardar}
            className="p-6"
          >

            <div className="grid gap-5 md:grid-cols-2">

              <Campo
                label="Nombre *"
                value={form.nombre}
                onChange={(v) =>
                  actualizar("nombre", v)
                }
              />

              <Campo
                label="Apellido"
                value={form.apellido}
                onChange={(v) =>
                  actualizar("apellido", v)
                }
              />

              <Campo
                label="Legajo"
                value={form.legajo}
                onChange={(v) =>
                  actualizar("legajo", v)
                }
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Dependencia
                </label>

                <select
                  value={form.dependencia_id}
                  onChange={(e) =>
                    actualizar(
                      "dependencia_id",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600"
                >
                  <option value="">
                    Seleccionar dependencia
                  </option>

                  {dependencias.map((dep) => (
                    <option
                      key={dep.id}
                      value={dep.id}
                    >
                      {dep.nombre}
                    </option>
                  ))}

                </select>
              </div>

              <Campo
                label="Cargo"
                value={form.cargo}
                onChange={(v) =>
                  actualizar("cargo", v)
                }
              />

              <Campo
                label="Función"
                value={form.funcion}
                onChange={(v) =>
                  actualizar("funcion", v)
                }
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo de contratación
                </label>

                <select
                  value={form.tipo_contratacion}
                  onChange={(e) =>
                    actualizar(
                      "tipo_contratacion",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600"
                >
                  <option value="">
                    Seleccionar
                  </option>

                  <option value="Planta permanente">
                    Planta permanente
                  </option>

                  <option value="Temporario">
                    Temporario
                  </option>

                  <option value="Contratado">
                    Contratado
                  </option>

                  <option value="Monotributo">
                    Monotributo
                  </option>

                  <option value="Beca">
                    Beca
                  </option>

                  <option value="Otro">
                    Otro
                  </option>
                </select>
              </div>

              <Campo
                label="Categoría"
                value={form.categoria}
                onChange={(v) =>
                  actualizar("categoria", v)
                }
              />

              <Campo
                label="Horas"
                placeholder="Ej: 40 hs"
                value={form.horas}
                onChange={(v) =>
                  actualizar("horas", v)
                }
              />

              <Campo
                label="Teléfono"
                value={form.telefono}
                onChange={(v) =>
                  actualizar("telefono", v)
                }
              />

              <Campo
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) =>
                  actualizar("email", v)
                }
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Fecha de ingreso
                </label>

                <input
                  type="date"
                  value={form.fecha_ingreso}
                  onChange={(e) =>
                    actualizar(
                      "fecha_ingreso",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600"
                />
              </div>

            </div>

            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Observaciones
              </label>

              <textarea
                rows={4}
                value={form.observaciones}
                onChange={(e) =>
                  actualizar(
                    "observaciones",
                    e.target.value
                  )
                }
                placeholder="Información adicional..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600"
              />

            </div>

            {mensaje && (
              <div
                className={`mt-5 flex items-center gap-2 rounded-xl border p-3 text-sm ${
                  mensaje.tipo === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >

                {mensaje.tipo === "ok" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}

                {mensaje.texto}

              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">

              <a
                href="/personal"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </a>

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

                Guardar personal
              </button>

            </div>

          </form>

        </div>

      </div>

    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
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
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600"
      />

    </div>
  );
}
