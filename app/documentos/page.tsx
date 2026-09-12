"use client";

import {
  Search,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Building2,
  Loader2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Documento = {
  id: string;
  nombre: string;
  storage_path: string | null;
  mime_type: string | null;
  tamano_bytes: number | null;
  descripcion: string | null;
  created_at: string;

  dependencia: {
    id: string;
    nombre: string;
  } | null;
};

export default function DocumentosPage() {
  const supabase = createClient();

  const [documentos, setDocumentos] =
    useState<Documento[]>([]);

  const [buscar, setBuscar] = useState("");
  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("documentos")
        .select(`
          id,
          nombre,
          storage_path,
          mime_type,
          tamano_bytes,
          descripcion,
          created_at,
          dependencia:dependencias(
            id,
            nombre
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!error) {
        setDocumentos(
          (data || []) as unknown as Documento[]
        );
      }

      setCargando(false);
    }

    cargar();
  }, []);

  const visibles = useMemo(() => {
    const texto =
      buscar.trim().toLowerCase();

    return documentos.filter((doc) => {
      const contenido = [
        doc.nombre,
        doc.descripcion,
        doc.mime_type,
        doc.dependencia?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [documentos, buscar]);

  function icono(documento: Documento) {
    const mime =
      documento.mime_type || "";

    const nombre =
      documento.nombre.toLowerCase();

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
      nombre.endsWith(".pdf") ||
      nombre.endsWith(".doc") ||
      nombre.endsWith(".docx")
    ) {
      return FileText;
    }

    return File;
  }

  function tamano(bytes: number | null) {
    if (!bytes) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(
        1
      )} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  async function abrir(
    documento: Documento
  ) {
    if (!documento.storage_path) return;

    const { data, error } =
      await supabase.storage
        .from(
          "documentos-institucionales"
        )
        .createSignedUrl(
          documento.storage_path,
          120
        );

    if (
      error ||
      !data?.signedUrl
    ) {
      alert(
        "No se pudo abrir el archivo."
      );
      return;
    }

    window.open(
      data.signedUrl,
      "_blank"
    );
  }

  return (
    <AppShell activo="Documentos">

      <header className="border-b border-slate-300 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold">
            Documentos
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">

        <section className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Archivos
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {documentos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Resultados
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {visibles.length}
            </p>
          </div>

        </section>

        <section className="mt-5 rounded-2xl border border-slate-400 bg-white p-4 shadow-sm">

          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">

            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              value={buscar}
              onChange={(e) =>
                setBuscar(e.target.value)
              }
              placeholder="Buscar archivo, descripción o dependencia..."
              className="w-full bg-transparent text-sm outline-none"
            />

          </div>

        </section>

        {cargando ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2
              className="animate-spin"
              size={24}
            />
          </div>
        ) : (
          <section className="mt-5 space-y-3">

            {visibles.map((documento) => {
              const Icon =
                icono(documento);

              return (
                <div
                  key={documento.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-400 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
                >

                  <div className="flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                      <Icon size={20} />
                    </div>

                    <div>

                      <h2 className="font-semibold">
                        {documento.nombre}
                      </h2>

                      {documento.descripcion && (
                        <p className="mt-1 text-sm text-slate-600">
                          {
                            documento.descripcion
                          }
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">

                        {documento.tamano_bytes && (
                          <span>
                            {tamano(
                              documento.tamano_bytes
                            )}
                          </span>
                        )}

                        {documento.dependencia && (
                          <span className="flex items-center gap-1">
                            <Building2
                              size={13}
                            />
                            {
                              documento
                                .dependencia
                                .nombre
                            }
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      abrir(documento)
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                  >
                    <Download size={16} />
                    Abrir
                  </button>

                </div>
              );
            })}

            {visibles.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-400 bg-white p-10 text-center">
                <File
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 text-sm text-slate-500">
                  No hay documentos para mostrar.
                </p>
              </div>
            )}

          </section>
        )}

      </div>

    </AppShell>
  );
}

