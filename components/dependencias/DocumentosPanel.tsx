"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Documento = {
  id: string;
  nombre: string;
  storage_path: string | null;
  mime_type: string | null;
  tamano_bytes: number | null;
  descripcion: string | null;
  created_at: string;
};

export default function DocumentosPanel({
  dependenciaId,
}: {
  dependenciaId: string;
}) {
  const supabase = createClient();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [cargando, setCargando] = useState(true);

  async function cargarDocumentos() {
    setCargando(true);

    const { data, error } = await supabase
      .from("documentos")
      .select(`
        id,
        nombre,
        storage_path,
        mime_type,
        tamano_bytes,
        descripcion,
        created_at
      `)
      .eq("dependencia_id", dependenciaId)
      .order("created_at", { ascending: false });

    if (!error) {
      setDocumentos(data || []);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDocumentos();
  }, [dependenciaId]);

  async function subirDocumento() {
    if (!archivo) return;

    setSubiendo(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubiendo(false);
      return;
    }

    const nombreSeguro = archivo.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const ruta = `${dependenciaId}/${Date.now()}-${nombreSeguro}`;

    const { error: errorStorage } = await supabase.storage
      .from("documentos-institucionales")
      .upload(ruta, archivo, {
        contentType: archivo.type || "application/octet-stream",
        upsert: false,
      });

    if (errorStorage) {
      alert("No se pudo subir el archivo.");
      console.error(errorStorage);
      setSubiendo(false);
      return;
    }

    const { error: errorDB } = await supabase
      .from("documentos")
      .insert({
        nombre: archivo.name,
        storage_path: ruta,
        mime_type: archivo.type || null,
        tamano_bytes: archivo.size,
        descripcion: descripcion.trim() || null,
        dependencia_id: dependenciaId,
        subido_por: user.id,
        tipo: archivo.type || "archivo",
      });

    if (errorDB) {
      await supabase.storage
        .from("documentos-institucionales")
        .remove([ruta]);

      console.error(errorDB);
      alert("No se pudo registrar el documento.");
      setSubiendo(false);
      return;
    }

    setArchivo(null);
    setDescripcion("");

    const input = document.getElementById(
      "archivo-documento"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }

    await cargarDocumentos();

    setSubiendo(false);
  }

  async function abrirDocumento(documento: Documento) {
    if (!documento.storage_path) return;

    const { data, error } = await supabase.storage
      .from("documentos-institucionales")
      .createSignedUrl(documento.storage_path, 60);

    if (error || !data?.signedUrl) {
      alert("No se pudo abrir el documento.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function eliminarDocumento(documento: Documento) {
    const confirmar = window.confirm(
      `¿Eliminar "${documento.nombre}"?`
    );

    if (!confirmar) return;

    if (documento.storage_path) {
      await supabase.storage
        .from("documentos-institucionales")
        .remove([documento.storage_path]);
    }

    await supabase
      .from("documentos")
      .delete()
      .eq("id", documento.id);

    await cargarDocumentos();
  }

  function obtenerIcono(documento: Documento) {
    const mime = documento.mime_type || "";
    const nombre = documento.nombre.toLowerCase();

    if (
      mime.includes("spreadsheet") ||
      mime.includes("excel") ||
      nombre.endsWith(".xlsx") ||
      nombre.endsWith(".xls")
    ) {
      return FileSpreadsheet;
    }

    if (mime.startsWith("image/")) {
      return FileImage;
    }

    if (
      mime.includes("pdf") ||
      mime.includes("word") ||
      nombre.endsWith(".docx") ||
      nombre.endsWith(".doc") ||
      nombre.endsWith(".pdf")
    ) {
      return FileText;
    }

    return File;
  }

  function formatearTamano(bytes: number | null) {
    if (!bytes) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

      <div>
        <h2 className="text-lg font-semibold">
          Documentos
        </h2>

        <p className="text-sm text-black">
          {documentos.length} archivos asociados
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-400 bg-slate-100 p-5">

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">

          <input
            id="archivo-documento"
            type="file"
            onChange={(e) =>
              setArchivo(e.target.files?.[0] || null)
            }
            className="rounded-xl border border-slate-400 bg-white p-3 text-sm"
          />

          <input
            value={descripcion}
            onChange={(e) =>
              setDescripcion(e.target.value)
            }
            placeholder="Descripción opcional"
            className="rounded-xl border border-slate-400 bg-white px-4 py-3 text-sm outline-none"
          />

          <button
            onClick={subirDocumento}
            disabled={!archivo || subiendo}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {subiendo ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Subiendo
              </>
            ) : (
              <>
                <Upload size={18} />
                Subir archivo
              </>
            )}
          </button>

        </div>

      </div>

      {cargando ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2
            size={22}
            className="animate-spin text-black"
          />
        </div>
      ) : documentos.length > 0 ? (
        <div className="mt-5 space-y-3">

          {documentos.map((documento) => {
            const Icon = obtenerIcono(documento);

            return (
              <div
                key={documento.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-400 bg-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-400 bg-white text-sky-700">
                    <Icon size={21} />
                  </div>

                  <div>
                    <p className="font-semibold">
                      {documento.nombre}
                    </p>

                    {documento.descripcion && (
                      <p className="mt-1 text-sm text-black">
                        {documento.descripcion}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-black">
                      {formatearTamano(
                        documento.tamano_bytes
                      )}
                    </p>
                  </div>

                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      abrirDocumento(documento)
                    }
                    className="flex items-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm text-black hover:bg-slate-100"
                  >
                    <Download size={16} />
                    Abrir
                  </button>

                  <button
                    onClick={() =>
                      eliminarDocumento(documento)
                    }
                    className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      ) : (
        <div className="mt-5 flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-100">
          <p className="text-sm text-black">
            Todavía no hay documentos asociados.
          </p>
        </div>
      )}

    </section>
  );
}



