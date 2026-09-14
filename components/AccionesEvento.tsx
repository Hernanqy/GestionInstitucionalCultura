"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";



export default function AccionesEvento() {
  const params = useParams();
  const eventoId = String(params.id);
  const supabase = createClient();
  const router = useRouter();

  const [abierto, setAbierto] =
    useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [eliminando, setEliminando] =
    useState(false);

  const [form, setForm] = useState({
    nombre: "",
    fecha: "",
    hora: "",
    lugar: "",
    descripcion: "",
    estado: "pendiente",
  });

  async function cargarEvento() {
    const { data, error } = await supabase
      .from("eventos")
      .select(`
        nombre,
        fecha,
        hora,
        lugar,
        descripcion,
        estado
      `)
      .eq("id", eventoId)
      .single();

    if (error || !data) {
      console.error(error);
      return;
    }

    setForm({
      nombre: data.nombre || "",
      fecha: data.fecha || "",
      hora: data.hora
        ? data.hora.slice(0, 5)
        : "",
      lugar: data.lugar || "",
      descripcion:
        data.descripcion || "",
      estado:
        data.estado || "pendiente",
    });
  }

  useEffect(() => {
    if (abierto) {
      cargarEvento();
    }
  }, [abierto]);

  async function guardar() {
    if (!form.nombre.trim()) {
      alert(
        "El nombre del evento es obligatorio."
      );
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from("eventos")
      .update({
        nombre: form.nombre.trim(),

        fecha:
          form.fecha || null,

        hora:
          form.hora
            ? `${form.hora}:00`
            : null,

        lugar:
          form.lugar.trim() || null,

        descripcion:
          form.descripcion.trim() ||
          null,

        estado:
          form.estado,
      })
      .eq("id", eventoId);

    setGuardando(false);

    if (error) {
      console.error(error);
      alert(
        "No se pudo modificar el evento."
      );
      return;
    }

    setAbierto(false);

    router.refresh();

    window.dispatchEvent(
      new Event("gestion:actualizada")
    );
  }

  async function eliminar() {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar este evento?"
    );

    if (!confirmar) return;

    setEliminando(true);

    // Obtener ingreso que originó el evento
    const { data: evento } =
      await supabase
        .from("eventos")
        .select("origen_ingreso_id")
        .eq("id", eventoId)
        .single();

    // Si el evento creó un pendiente automático,
    // quitarlo también de Mi lista.
    if (evento?.origen_ingreso_id) {
      await supabase
        .from("pendientes")
        .delete()
        .eq(
          "origen_ingreso_id",
          evento.origen_ingreso_id
        );
    }

    const { error } = await supabase
      .from("eventos")
      .delete()
      .eq("id", eventoId);

    setEliminando(false);

    if (error) {
      console.error(error);

      alert(
        "No se pudo eliminar el evento."
      );

      return;
    }

    window.dispatchEvent(
      new Event("gestion:actualizada")
    );

    router.push("/agenda");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">

        <button
          onClick={() =>
            setAbierto(true)
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-slate-700
            transition
            hover:bg-slate-50
          "
        >
          <Pencil size={17} />
          Editar
        </button>

        <button
          onClick={eliminar}
          disabled={eliminando}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-2.5
            text-sm
            font-medium
            text-red-700
            transition
            hover:bg-red-100
            disabled:opacity-50
          "
        >
          {eliminando ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={17} />
          )}

          Eliminar
        </button>

      </div>

      {abierto && (
        <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-black/40
          p-4
        ">

          <div className="
            w-full
            max-w-xl
            rounded-2xl
            bg-white
            shadow-2xl
          ">

            <div className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200
              px-6
              py-4
            ">

              <h2 className="
                text-lg
                font-semibold
                text-slate-900
              ">
                Editar evento
              </h2>

              <button
                onClick={() =>
                  setAbierto(false)
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-500
                  hover:bg-slate-100
                "
              >
                <X size={20} />
              </button>

            </div>

            <div className="
              max-h-[75vh]
              space-y-4
              overflow-y-auto
              p-6
            ">

              <Campo
                label="Nombre"
                value={form.nombre}
                onChange={(v) =>
                  setForm({
                    ...form,
                    nombre: v,
                  })
                }
              />

              <div className="
                grid
                gap-4
                sm:grid-cols-2
              ">

                <div>
                  <label className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  ">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fecha:
                          e.target.value,
                      })
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-cyan-600
                    "
                  />
                </div>

                <div>
                  <label className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  ">
                    Hora
                  </label>

                  <input
                    type="time"
                    value={form.hora}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hora:
                          e.target.value,
                      })
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-cyan-600
                    "
                  />
                </div>

              </div>

              <Campo
                label="Lugar"
                value={form.lugar}
                onChange={(v) =>
                  setForm({
                    ...form,
                    lugar: v,
                  })
                }
              />

              <div>
                <label className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                ">
                  Estado
                </label>

                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estado:
                        e.target.value,
                    })
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-cyan-600
                  "
                >
                  <option value="pendiente">
                    Pendiente
                  </option>

                  <option value="completado">
                    Completado
                  </option>

                  <option value="cancelado">
                    Cancelado
                  </option>
                </select>
              </div>

              <div>
                <label className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-slate-700
                ">
                  Descripción
                </label>

                <textarea
                  rows={4}
                  value={
                    form.descripcion
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descripcion:
                        e.target.value,
                    })
                  }
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-300
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-cyan-600
                  "
                />
              </div>

            </div>

            <div className="
              flex
              justify-end
              gap-3
              border-t
              border-slate-200
              px-6
              py-4
            ">

              <button
                onClick={() =>
                  setAbierto(false)
                }
                className="
                  rounded-xl
                  border
                  border-slate-300
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                "
              >
                Cancelar
              </button>

              <button
                onClick={guardar}
                disabled={guardando}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-[#0f2b46]
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  disabled:opacity-50
                "
              >

                {guardando ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                Guardar cambios
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>

      <label className="
        mb-2
        block
        text-sm
        font-medium
        text-slate-700
      ">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          px-4
          py-3
          text-sm
          outline-none
          focus:border-cyan-600
        "
      />

    </div>
  );
}

