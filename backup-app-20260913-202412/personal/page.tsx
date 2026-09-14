"use client";

import {
  Search,
  UserRound,
  BriefcaseBusiness,
  Building2,
  Clock3,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  funcion: string | null;
  tipo_contratacion: string | null;
  horas: string | null;
  legajo: string | null;
  area: string | null;

  dependencias:
    | {
        nombre: string;
      }
    | null;
};

export default function PersonalPage() {
  const supabase = createClient();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [buscar, setBuscar] = useState("");
  const [filtroArea, setFiltroArea] = useState("Todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarPersonal() {
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
        .from("personas")
        .select(`
          id,
          nombre,
          apellido,
          cargo,
          funcion,
          tipo_contratacion,
          horas,
          legajo,
          area,
          dependencias (
            nombre
          )
        `)
        .eq("activo", true)
        .order("nombre");

      if (error) {
        console.error(error);
        setError("No se pudo cargar el personal.");
        setCargando(false);
        return;
      }

      setPersonas((data || []) as Persona[]);
      setCargando(false);
    }

    cargarPersonal();
  }, []);

  const areas = useMemo(() => {
    const lista = personas
      .map((persona) => persona.area)
      .filter((area): area is string => Boolean(area));

    return ["Todas", ...Array.from(new Set(lista)).sort()];
  }, [personas]);

  const resultado = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    return personas.filter((persona) => {
      const contenido = [
        persona.nombre,
        persona.apellido,
        persona.cargo,
        persona.funcion,
        persona.tipo_contratacion,
        persona.legajo,
        persona.area,
        persona.dependencias?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda = contenido.includes(texto);

      const coincideArea =
        filtroArea === "Todas" ||
        persona.area === filtroArea;

      return coincideBusqueda && coincideArea;
    });
  }, [personas, buscar, filtroArea]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={22} />
          Cargando personal...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef4f8] text-slate-900">
      <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Users size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Personal
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Personas, funciones y dependencias
                </p>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm">

            <Search
              size={18}
              className="text-sky-500"
            />

            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar persona, cargo, legajo..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:w-80"
            />

          </div>

        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,43,70,0.06)]">
            <p className="text-sm text-slate-500">
              Personal total
            </p>

            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {personas.length}
            </p>
          </div>

          <div className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,43,70,0.06)]">
            <p className="text-sm text-slate-500">
              Resultados visibles
            </p>

            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {resultado.length}
            </p>
          </div>

          <div className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,43,70,0.06)]">
            <p className="text-sm text-slate-500">
              Áreas
            </p>

            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {areas.length - 1}
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
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-sky-100 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
              }`}
            >
              {area}
            </button>
          ))}

        </div>

        <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {resultado.map((persona) => (

            <a
              key={persona.id}
              href={`/personal/${persona.id}`}
              className="
                group
                overflow-hidden
                rounded-[28px]
                border
                border-sky-100
                bg-white
                shadow-[0_8px_24px_rgba(15,43,70,0.08)]
                transition-all
                duration-200
                hover:-translate-y-1
                hover:border-sky-200
                hover:shadow-[0_14px_34px_rgba(15,43,70,0.12)]
              "
            >

              <div className="flex items-start justify-between border-b border-sky-50 bg-gradient-to-r from-sky-50/70 via-white to-white px-5 py-4">

                <div className="flex min-w-0 items-center gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 shadow-sm">
                    <UserRound size={22} />
                  </div>

                  <div className="min-w-0">

                    <h3 className="truncate text-lg font-semibold leading-tight text-slate-800">
                      {persona.nombre}
                      {persona.apellido
                        ? ` ${persona.apellido}`
                        : ""}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {persona.cargo && (
                        <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                          {persona.cargo}
                        </span>
                      )}

                      {persona.tipo_contratacion && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          {persona.tipo_contratacion}
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                <ChevronRight
                  className="mt-1 shrink-0 text-sky-400 transition group-hover:translate-x-1 group-hover:text-sky-600"
                  size={20}
                />

              </div>

              <div className="px-5 py-5">

                <div className="space-y-3">

                  {persona.funcion && (
                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <BriefcaseBusiness size={16} />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Función
                        </p>

                        <p className="text-sm font-medium text-slate-700">
                          {persona.funcion}
                        </p>
                      </div>

                    </div>
                  )}

                  {persona.dependencias?.nombre && (
                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <Building2 size={16} />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Dependencia
                        </p>

                        <p className="text-sm font-medium text-slate-700">
                          {persona.dependencias.nombre}
                        </p>
                      </div>

                    </div>
                  )}

                  {persona.horas && (
                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <Clock3 size={16} />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Carga horaria
                        </p>

                        <p className="text-sm font-medium text-slate-700">
                          {persona.horas}
                        </p>
                      </div>

                    </div>
                  )}

                </div>

                {persona.legajo && (
                  <div className="mt-5 border-t border-slate-100 pt-4">

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      Legajo {persona.legajo}
                    </span>

                  </div>
                )}

              </div>

            </a>
          ))}

        </section>

        {resultado.length === 0 && !error && (
          <div className="mt-8 rounded-[28px] border border-dashed border-sky-200 bg-white p-10 text-center shadow-sm">

            <p className="text-sm text-slate-500">
              No se encontraron personas.
            </p>

          </div>
        )}

      </div>
    </main>
  );
}
