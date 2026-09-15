"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  Save,
  Trash2,
  Upload,
  X,
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

export default function DocumentosPanel({ dependenciaId }: { dependenciaId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Documento | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarDocumentos() {
    setCargando(true);
    const { data, error } = await supabase
      .from("documentos")
      .select("id,nombre,storage_path,mime_type,tamano_bytes,descripcion,created_at")
      .eq("dependencia_id", dependenciaId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setDocumentos(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarDocumentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependenciaId]);

  async function subirDocumento() {
    if (!archivo) return;
    setSubiendo(true);
    setMensaje("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubiendo(false);
      return;
    }

    const nombreSeguro = archivo.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const ruta = `${dependenciaId}/${Date.now()}-${nombreSeguro}`;

    const { error: storageError } = await supabase.storage
      .from("documentos-institucionales")
      .upload(ruta, archivo, { contentType: archivo.type || "application/octet-stream", upsert: false });

    if (storageError) {
      console.error(storageError);
      setMensaje("No se pudo subir el archivo.");
      setSubiendo(false);
      return;
    }

    const { error: dbError } = await supabase.from("documentos").insert({
      nombre: archivo.name,
      storage_path: ruta,
      mime_type: archivo.type || null,
      tamano_bytes: archivo.size,
      descripcion: descripcion.trim() || null,
      dependencia_id: dependenciaId,
      subido_por: user.id,
      tipo: archivo.type || "archivo",
    });

    if (dbError) {
      await supabase.storage.from("documentos-institucionales").remove([ruta]);
      console.error(dbError);
      setMensaje("No se pudo registrar el documento.");
      setSubiendo(false);
      return;
    }

    setArchivo(null);
    setDescripcion("");
    const input = document.getElementById("archivo-documento") as HTMLInputElement | null;
    if (input) input.value = "";
    await cargarDocumentos();
    setSubiendo(false);
    setMensaje("Documento guardado dentro del espacio.");
  }

  async function abrirDocumento(documento: Documento) {
    if (!documento.storage_path) return;
    const { data, error } = await supabase.storage
      .from("documentos-institucionales")
      .createSignedUrl(documento.storage_path, 60);
    if (error || !data?.signedUrl) {
      setMensaje("No se pudo abrir el documento.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  function editarDocumento(documento: Documento) {
    setEditando(documento);
    setNombreEdit(documento.nombre);
    setDescripcionEdit(documento.descripcion || "");
    setMensaje("");
  }

  async function guardarEdicion() {
    if (!editando || !nombreEdit.trim()) return;
    const { error } = await supabase
      .from("documentos")
      .update({ nombre: nombreEdit.trim(), descripcion: descripcionEdit.trim() || null })
      .eq("id", editando.id);
    if (error) {
      console.error(error);
      setMensaje("No se pudo editar el documento.");
      return;
    }
    setEditando(null);
    await cargarDocumentos();
    setMensaje("Documento actualizado.");
  }

  async function eliminarDocumento(documento: Documento) {
    if (!window.confirm(`¿Eliminar "${documento.nombre}"?`)) return;
    if (documento.storage_path) {
      await supabase.storage.from("documentos-institucionales").remove([documento.storage_path]);
    }
    const { error } = await supabase.from("documentos").delete().eq("id", documento.id);
    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar el documento.");
      return;
    }
    if (editando?.id === documento.id) setEditando(null);
    await cargarDocumentos();
  }

  function icono(documento: Documento) {
    const mime = documento.mime_type || "";
    const nombre = documento.nombre.toLowerCase();
    if (mime.includes("spreadsheet") || mime.includes("excel") || nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) return FileSpreadsheet;
    if (mime.startsWith("image/")) return FileImage;
    if (mime.includes("pdf") || mime.includes("word") || nombre.endsWith(".docx") || nombre.endsWith(".doc") || nombre.endsWith(".pdf")) return FileText;
    return File;
  }

  function tamano(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#102b43]">Documentos del espacio</h2>
            <p className="mt-1 text-sm text-slate-500">Subí, abrí, editá o eliminá archivos vinculados a esta dependencia.</p>
          </div>
          <label htmlFor="archivo-documento" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0f4777] px-4 py-2.5 text-sm font-bold text-white"><Upload size={17} /> Elegir archivo</label>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input id="archivo-documento" type="file" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="hidden" />
          <p className="text-sm font-bold text-[#102b43]">{archivo ? archivo.name : "Ningún archivo seleccionado"}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción opcional" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none" />
            <button onClick={subirDocumento} disabled={!archivo || subiendo} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{subiendo ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />} Subir</button>
          </div>
        </div>

        {mensaje && <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-900">{mensaje}</div>}

        {cargando ? (
          <div className="flex min-h-40 items-center justify-center"><Loader2 className="animate-spin text-cyan-700" /></div>
        ) : documentos.length ? (
          <div className="mt-4 space-y-3">
            {documentos.map((documento) => {
              const Icon = icono(documento);
              return <div key={documento.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-cyan-700"><Icon size={21} /></div><div className="min-w-0"><p className="truncate font-bold text-[#102b43]">{documento.nombre}</p>{documento.descripcion && <p className="mt-1 text-sm text-slate-600">{documento.descripcion}</p>}<p className="mt-1 text-xs text-slate-400">{tamano(documento.tamano_bytes)}</p></div></div><div className="flex shrink-0 flex-wrap gap-2"><button onClick={() => abrirDocumento(documento)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600"><Download size={15} /> Abrir</button><button onClick={() => editarDocumento(documento)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600"><Pencil size={15} /> Editar</button><button onClick={() => eliminarDocumento(documento)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><Trash2 size={15} /> Eliminar</button></div></div>;
            })}
          </div>
        ) : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Todavía no hay documentos asociados.</div>}
      </div>

      <aside className="h-fit rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-5">
        <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Pencil size={18} /></div><h2 className="text-lg font-extrabold text-[#102b43]">Editar documento</h2></div>
        {editando ? <div className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Nombre</span><input value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none" /></label><label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Descripción</span><textarea rows={5} value={descripcionEdit} onChange={(e) => setDescripcionEdit(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none" /></label><div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4"><button onClick={guardarEdicion} className="inline-flex items-center gap-2 rounded-xl bg-[#0f4777] px-4 py-2.5 text-sm font-bold text-white"><Save size={17} /> Guardar</button><button onClick={() => setEditando(null)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-600"><X size={17} /> Cancelar</button><button onClick={() => eliminarDocumento(editando)} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700"><Trash2 size={17} /> Eliminar</button></div></div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Seleccioná “Editar” en un documento para cambiar su nombre o descripción.</div>}
      </aside>
    </section>
  );
}
