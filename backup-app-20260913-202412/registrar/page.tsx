"use client";

import {
  FileText,
  Image as ImageIcon,
  Mic,
  Upload,
  Save,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
};

export default function RegistrarPage() {
  const supabase = createClient();

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [dependenciaId, setDependenciaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState("Nota");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
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

      const { data } = await supabase
        .from("dependencias")
        .select("id,nombre")
        .eq("activa", true)
        .order("nombre");

      setDependencias(data || []);
    }

    cargar();
  }, []);

  async function guardar() {
    if (!contenido.trim() && !archivo) {
      setMensaje("Escribí algo o seleccioná un archivo.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setGuardando(false);
      return;
    }

    const { data: registro, error: errorRegistro } = await supabase
      .from("registros")
      .insert({
        titulo: titulo.trim() || null,
        contenido: contenido.trim() || null,
        tipo,
        dependencia_id: dependenciaId || null,
      })
      .select("id")
      .single();

    if (errorRegistro || !registro) {
      setMensaje("No se pudo guardar el registro.");
      setGuardando(false);
      return;
    }

    if (archivo) {
      const nombreSeguro = archivo.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      const carpeta = dependenciaId || "sin-dependencia";
      const ruta = `${carpeta}/${Date.now()}-${nombreSeguro}`;

      const { error: errorStorage } = await supabase.storage
        .from("documentos-institucionales")
        .upload(ruta, archivo, {
          contentType: archivo.type || "application/octet-stream",
          upsert: false,
        });

      if (errorStorage) {
        setMensaje("El registro se guardó, pero el archivo no pudo subirse.");
        setGuardando(false);
        return;
      }

      await supabase.from("documentos").insert({
        nombre: archivo.name,
        storage_path: ruta,
        mime_type: archivo.type || null,
        tamano_bytes: archivo.size,
        dependencia_id: dependenciaId || null,
        registro_id: registro.id,
        subido_por: user.id,
        tipo: archivo.type || "archivo",
      });
    }

    setTitulo("");
    setContenido("");
    setTipo("Nota");
    setArchivo(null);
    setDependenciaId("");

    const input = document.getElementById(
      "archivo-registro"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }

    setMensaje("Registro guardado correctamente.");
    setGuardando(false);
  }

  return (
    <AppShell activo="Registrar">

      <header className="border-b border-slate-400 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold">
            Registrar información
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-6 md:px-8">

        <section className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="grid gap-4">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Dependencia
              </label>

              <select
                value={dependenciaId}
                onChange={(e) => setDependenciaId(e.target.value)}
                className="w-full rounded-xl border border-slate-400 bg-white px-4 py-3"
              >
                <option value="">
                  Sin dependencia específica
                </option>

                {dependencias.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Tipo
              </label>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-400 bg-white px-4 py-3"
              >
                <option>Nota</option>
                <option>Reunión</option>
                <option>Novedad</option>
                <option>Observación</option>
                <option>Antecedente</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Título
              </label>

              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título opcional"
                className="w-full rounded-xl border border-slate-400 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Información
              </label>

              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribí una nota, novedad, reunión o información..."
                rows={7}
                className="w-full rounded-xl border border-slate-400 px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Archivo, foto o audio
              </label>

              <div className="rounded-xl border border-dashed border-slate-400 bg-slate-100 p-5">

                <div className="mb-3 flex gap-3 text-black">
                  <ImageIcon size={20} />
                  <Mic size={20} />
                  <FileText size={20} />
                  <Upload size={20} />
                </div>

                <input
                  id="archivo-registro"
                  type="file"
                  accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) =>
                    setArchivo(e.target.files?.[0] || null)
                  }
                  className="w-full text-sm"
                />

                {archivo && (
                  <p className="mt-3 text-sm text-black">
                    Seleccionado: <strong>{archivo.name}</strong>
                  </p>
                )}
              </div>
            </div>

            {mensaje && (
              <div className="rounded-xl border border-slate-400 bg-slate-100 px-4 py-3 text-sm">
                {mensaje}
              </div>
            )}

            <button
              onClick={guardar}
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar
                </>
              )}
            </button>

          </div>

        </section>

      </div>

    </AppShell>
  );
}



