"use client";

import {
  Search,
  Users,
  Building2,
  CalendarDays,
  FileText,
  Loader2,
} from "lucide-react";

import { useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Resultado = {
  tipo: string;
  titulo: string;
  subtitulo?: string;
  href?: string;
};

function slug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BuscarPage() {
  const supabase = createClient();

  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    const texto = consulta.trim();

    if (texto.length < 2) return;

    setBuscando(true);

    const [
      personas,
      dependencias,
      eventos,
      registros,
    ] = await Promise.all([
      supabase
        .from("personas")
        .select("id,nombre,apellido,cargo")
        .or(
          `nombre.ilike.%${texto}%,apellido.ilike.%${texto}%,cargo.ilike.%${texto}%,legajo.ilike.%${texto}%`
        )
        .limit(20),

      supabase
        .from("dependencias")
        .select("id,nombre,area")
        .or(
          `nombre.ilike.%${texto}%,area.ilike.%${texto}%`
        )
        .limit(20),

      supabase
        .from("eventos")
        .select("id,nombre,lugar,fecha")
        .or(
          `nombre.ilike.%${texto}%,lugar.ilike.%${texto}%`
        )
        .limit(20),

      supabase
        .from("registros")
        .select("id,titulo,contenido,tipo")
        .or(
          `titulo.ilike.%${texto}%,contenido.ilike.%${texto}%`
        )
        .limit(20),
    ]);

    const lista: Resultado[] = [];

    for (const item of personas.data || []) {
      lista.push({
        tipo: "Persona",
        titulo: `${item.nombre}${item.apellido ? ` ${item.apellido}` : ""}`,
        subtitulo: item.cargo || "",
      });
    }

    for (const item of dependencias.data || []) {
      lista.push({
        tipo: "Dependencia",
        titulo: item.nombre,
        subtitulo: item.area || "",
        href: `/dependencias/${slug(item.nombre)}`,
      });
    }

    for (const item of eventos.data || []) {
      lista.push({
        tipo: "Evento",
        titulo: item.nombre,
        subtitulo: item.lugar || "",
      });
    }

    for (const item of registros.data || []) {
      lista.push({
        tipo: item.tipo || "Registro",
        titulo: item.titulo || "Registro sin título",
        subtitulo: item.contenido?.slice(0, 100) || "",
      });
    }

    setResultados(lista);
    setBuscando(false);
  }

  function icono(tipo: string) {
    if (tipo === "Persona") return Users;
    if (tipo === "Dependencia") return Building2;
    if (tipo === "Evento") return CalendarDays;

    return FileText;
  }

  return (
    <AppShell activo="Buscar">

      <header className="border-b border-slate-300 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold">
            Buscar
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">

        <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">

            <Search size={20} />

            <input
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  buscar();
                }
              }}
              placeholder="Buscar persona, espacio, evento o registro..."
              className="w-full bg-transparent outline-none"
            />

            <button
              onClick={buscar}
              className="rounded-lg bg-[#0f2b46] px-4 py-2 text-sm font-semibold text-white"
            >
              Buscar
            </button>

          </div>

        </div>

        {buscando ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2
              className="animate-spin"
              size={24}
            />
          </div>
        ) : (
          <div className="mt-5 space-y-3">

            {resultados.map((item, index) => {
              const Icon = icono(item.tipo);

              const contenido = (
                <div className="flex gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <Icon size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-cyan-700">
                      {item.tipo}
                    </p>

                    <h2 className="mt-1 font-semibold">
                      {item.titulo}
                    </h2>

                    {item.subtitulo && (
                      <p className="mt-1 text-sm text-slate-500">
                        {item.subtitulo}
                      </p>
                    )}
                  </div>

                </div>
              );

              if (item.href) {
                return (
                  <a
                    key={index}
                    href={item.href}
                  >
                    {contenido}
                  </a>
                );
              }

              return (
                <div key={index}>
                  {contenido}
                </div>
              );
            })}

          </div>
        )}

      </div>

    </AppShell>
  );
}
