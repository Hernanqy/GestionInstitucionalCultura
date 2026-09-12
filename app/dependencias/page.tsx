"use client";

import {
  Building2,
  Search,
  Users,
  ChevronRight,
  Landmark,
  GraduationCap,
  Trees,
  Music,
  Theater,
  Loader2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  personal: number;
};

function obtenerIcono(nombre: string, area: string | null) {
  const texto = `${nombre} ${area || ""}`.toLowerCase();

  if (
    texto.includes("sinfon") ||
    texto.includes("música") ||
    texto.includes("musica") ||
    texto.includes("orquesta") ||
    texto.includes("banda") ||
    texto.includes("cuarteto") ||
    texto.includes("quinteto") ||
    texto.includes("tango")
  ) {
    return Music;
  }

  if (
    texto.includes("museo") ||
    texto.includes("patrimonio") ||
    texto.includes("archivo") ||
    texto.includes("iiao")
  ) {
    return Landmark;
  }

  if (
    texto.includes("bioparque") ||
    texto.includes("máxima") ||
    texto.includes("maxima")
  ) {
    return Trees;
  }

  if (
    texto.includes("teatro") ||
    texto.includes("ballet") ||
    texto.includes("danza")
  ) {
    return Theater;
  }

  if (
    texto.includes("escuela") ||
    texto.includes("educación") ||
    texto.includes("educacion")
  ) {
    return GraduationCap;
  }

  return Building2;
}

function crearSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function DependenciasPage() {
  const supabase = createClient();

  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [buscar, setBuscar] = useState("");
  const [filtroArea, setFiltroArea] = useState("Todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("dependencias")
        .select(`
          id,
          nombre,
          area,
          personas(count)
        `)
        .eq("activa", true)
        .order("nombre");

      if (error) {
        console.error(error);
        setError("No se pudieron cargar las dependencias.");
        setCargando(false);
        return;
      }

      const resultado: Dependencia[] = (data || []).map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        area: item.area,
        personal: item.personas?.[0]?.count || 0,
      }));

      resultado.sort((a, b) => b.personal - a.personal);

      setDependencias(resultado);
      setCargando(false);
    }

    cargarDatos();
  }, []);

  const areas = useMemo(() => {
    const lista = dependencias
      .map((item) => item.area)
      .filter((area): area is string => Boolean(area));

    return ["Todas", ...Array.from(new Set(lista)).sort()];
  }, [dependencias]);

  const resultado = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    return dependencias.filter((item) => {
      const coincideBusqueda =
        item.nombre.toLowerCase().includes(texto) ||
        (item.area || "").toLowerCase().includes(texto);

      const coincideArea =
        filtroArea === "Todas" || item.area === filtroArea;

      return coincideBusqueda && coincideArea;
    });
  }, [dependencias, buscar, filtroArea]);

  const totalPersonal = dependencias.reduce(
    (total, item) => total + item.personal,
    0
  );

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-200/80">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={22} />
          Cargando dependencias...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-200/80 text-slate-900">
      <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-2xl font-semibold">
              Dependencias
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Espacios, áreas y equipos de trabajo
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-400 bg-white px-4 py-3 shadow-sm">
            <Search
              size={18}
              className="text-slate-500"
            />

            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar dependencia..."
              className="w-full bg-transparent text-sm outline-none sm:w-72"
            />
          </div>

        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Dependencias
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {dependencias.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Personal asociado
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {totalPersonal}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Resultados visibles
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {resultado.length}
            </p>
          </div>

        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">

          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setFiltroArea(area)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                filtroArea === area
                  ? "border-[#0f2b46] bg-[#0f2b46] text-white"
                  : "border-slate-400 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {area}
            </button>
          ))}

        </div>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

          {resultado.map((item) => {
            const Icon = obtenerIcono(item.nombre, item.area);

            return (
              <a
                key={item.id}
                href={`/dependencias/${crearSlug(item.nombre)}`}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-400
                  bg-white
                  p-5
                  shadow-sm
                  transition
                  hover:-translate-y-1
                  hover:border-slate-500
                  hover:shadow-lg
                "
              >
                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700">
                    <Icon size={22} />
                  </div>

                  <ChevronRight
                    size={20}
                    className="text-slate-400 transition group-hover:text-slate-800"
                  />

                </div>

                <h2 className="mt-4 font-semibold leading-5">
                  {item.nombre}
                </h2>

                <p className="mt-2 min-h-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.area || "Sin área asignada"}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-300 pt-4 text-sm text-slate-700">
                  <Users size={17} />

                  <strong>
                    {item.personal}
                  </strong>

                  <span>
                    {item.personal === 1
                      ? "persona"
                      : "personas"}
                  </span>
                </div>

              </a>
            );
          })}

        </section>

        {resultado.length === 0 && !error && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-400 bg-white p-10 text-center">
            <p className="text-sm text-slate-600">
              No se encontraron dependencias.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
