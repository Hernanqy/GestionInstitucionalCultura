"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  Building2,
  BriefcaseBusiness,
  ChevronRight,
  Loader2,
  BadgeCheck,
  Filter,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type DependenciaRef = {
  id: string;
  nombre: string;
};

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  legajo: string | null;
  area: string | null;
  cargo: string | null;
  funcion: string | null;
  tipo_contratacion: string | null;
  categoria: string | null;
  horas: string | null;
  telefono: string | null;
  email: string | null;
  dependencia_id: string | null;
  dependencias: DependenciaRef | null;
};

export default function PersonalPage() {
  const supabase = useMemo(() => createClient(), []);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [buscar, setBuscar] = useState("");
  const [area, setArea] = useState("Todas");
  const [dependencia, setDependencia] = useState("Todas");

  useEffect(() => {
    async function cargar() {
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
          legajo,
          area,
          cargo,
          funcion,
          tipo_contratacion,
          categoria,
          horas,
          telefono,
          email,
          dependencia_id,
          dependencias (
            id,
            nombre
          )
        `)
        .eq("activo", true)
        .order("nombre", { ascending: true })
        .range(0, 999);

      if (error) {
        console.error(error);
        setError("No se pudo cargar el personal.");
        setCargando(false);
        return;
      }

      setPersonas((data || []) as unknown as Persona[]);
      setCargando(false);
    }

    cargar();
  }, [supabase]);

  const areas = useMemo(() => {
    return [
      "Todas",
      ...Array.from(
        new Set(
          personas
            .map((persona) => persona.area)
            .filter((valor): valor is string => Boolean(valor))
        )
      ).sort(),
    ];
  }, [personas]);

  const dependencias = useMemo(() => {
    return [
      "Todas",
      ...Array.from(
        new Set(
          personas
            .map((persona) => persona.dependencias?.nombre)
            .filter((valor): valor is string => Boolean(valor))
        )
      ).sort(),
    ];
  }, [personas]);

  const filtradas = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    return personas.filter((persona) => {
      const nombreCompleto = [
        persona.nombre,
        persona.apellido,
        persona.legajo,
        persona.cargo,
        persona.funcion,
        persona.area,
        persona.dependencias?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideTexto =
        texto === "" || nombreCompleto.includes(texto);

      const coincideArea =
        area === "Todas" || persona.area === area;

      const coincideDependencia =
        dependencia === "Todas" ||
        persona.dependencias?.nombre === dependencia;

      return (
        coincideTexto &&
        coincideArea &&
        coincideDependencia
      );
    });
  }, [personas, buscar, area, dependencia]);

  const totalDependencias = useMemo(() => {
    return new Set(
      personas
        .map((persona) => persona.dependencia_id)
        .filter(Boolean)
    ).size;
  }, [personas]);

  const totalAreas = useMemo(() => {
    return new Set(
      personas
        .map((persona) => persona.area)
        .filter(Boolean)
    ).size;
  }, [personas]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf4f8]">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Cargando personal...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4f8] text-slate-900 pb-24 lg:pb-10">

      <div className="mx-auto max-w-[1580px] px-5 py-7 md:px-8">

        {/* CABECERA */}

        <div
          className="
            flex flex-col gap-5
            xl:flex-row
            xl:items-end
            xl:justify-between
          "
        >
          <div>
            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-14 w-14
                  items-center justify-center
                  rounded-2xl
                  border border-emerald-200
                  bg-gradient-to-br
                  from-emerald-50
                  to-teal-100
                  text-[34px]
                  shadow-sm
                "
              >
                👥
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Personal
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Personas, funciones y equipos de trabajo
                </p>
              </div>

            </div>
          </div>

          <div
            className="
              flex w-full max-w-lg
              items-center gap-3
              rounded-2xl
              border border-slate-300
              bg-white
              px-4 py-3.5
              shadow-sm
            "
          >
            <Search
              size={20}
              className="text-slate-400"
            />

            <input
              value={buscar}
              onChange={(e) =>
                setBuscar(e.target.value)
              }
              placeholder="Buscar nombre, legajo, cargo..."
              className="
                w-full bg-transparent
                text-sm
                outline-none
                placeholder:text-slate-400
              "
            />
          </div>
        </div>

        {/* RESUMEN */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Resumen
            icono="👥"
            etiqueta="Personal activo"
            valor={personas.length}
          />

          <Resumen
            icono="🏢"
            etiqueta="Dependencias"
            valor={totalDependencias}
          />

          <Resumen
            icono="🗂️"
            etiqueta="Áreas"
            valor={totalAreas}
          />

          <Resumen
            icono="🔎"
            etiqueta="Resultados"
            valor={filtradas.length}
          />

        </section>

        {/* FILTROS */}

        <section
          className="
            mt-6
            rounded-[20px]
            border border-slate-300
            bg-white
            p-5
            shadow-[0_5px_14px_rgba(15,23,42,0.04)]
          "
        >
          <div className="mb-4 flex items-center gap-2">
            <Filter
              size={18}
              className="text-cyan-700"
            />

            <h2 className="font-semibold">
              Filtros
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Área
              </label>

              <select
                value={area}
                onChange={(e) =>
                  setArea(e.target.value)
                }
                className="
                  w-full rounded-xl
                  border border-slate-300
                  bg-slate-50
                  px-4 py-3
                  text-sm
                  outline-none
                  focus:border-cyan-600
                "
              >
                {areas.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Dependencia
              </label>

              <select
                value={dependencia}
                onChange={(e) =>
                  setDependencia(e.target.value)
                }
                className="
                  w-full rounded-xl
                  border border-slate-300
                  bg-slate-50
                  px-4 py-3
                  text-sm
                  outline-none
                  focus:border-cyan-600
                "
              >
                {dependencias.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {(area !== "Todas" ||
            dependencia !== "Todas" ||
            buscar !== "") && (
            <button
              onClick={() => {
                setBuscar("");
                setArea("Todas");
                setDependencia("Todas");
              }}
              className="mt-4 text-sm font-semibold text-cyan-700"
            >
              Limpiar filtros
            </button>
          )}

        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* RESULTADOS */}

        <section className="mt-7">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Personas
            </h2>

            <span className="text-sm text-slate-500">
              {filtradas.length} resultados
            </span>
          </div>

          {filtradas.length > 0 ? (
            <div
              className="
                grid gap-4
                md:grid-cols-2
                xl:grid-cols-3
                2xl:grid-cols-4
              "
            >
              {filtradas.map((persona) => (
                <a
                  key={persona.id}
                  href={`/personal/${persona.id}`}
                  className="
                    group
                    flex min-h-[215px]
                    flex-col
                    rounded-[22px]
                    border border-slate-300
                    bg-white
                    p-5
                    shadow-[0_6px_18px_rgba(15,23,42,0.05)]
                    transition-all

                    hover:-translate-y-1
                    hover:border-slate-400
                    hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]
                  "
                >

                  <div className="flex items-start justify-between">

                    <div
                      className="
                        flex h-14 w-14
                        items-center justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        from-cyan-50
                        to-blue-100
                        text-lg font-bold
                        text-[#0f2f4d]
                        shadow-sm
                      "
                    >
                      {iniciales(
                        persona.nombre,
                        persona.apellido
                      )}
                    </div>

                    <ChevronRight
                      size={20}
                      className="
                        text-slate-300
                        transition
                        group-hover:translate-x-1
                        group-hover:text-slate-600
                      "
                    />

                  </div>

                  <h3 className="mt-4 text-[17px] font-bold leading-5">
                    {persona.nombre}
                    {persona.apellido
                      ? ` ${persona.apellido}`
                      : ""}
                  </h3>

                  {persona.cargo && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                      <BriefcaseBusiness size={16} />
                      <span>{persona.cargo}</span>
                    </div>
                  )}

                  {persona.dependencias?.nombre && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <Building2 size={16} />
                      <span>
                        {persona.dependencias.nombre}
                      </span>
                    </div>
                  )}

                  <div className="mt-auto pt-4">

                    <div className="border-t border-slate-200 pt-3">

                      <div className="flex items-center justify-between gap-3">

                        <div className="text-xs text-slate-500">
                          {persona.legajo
                            ? `Legajo ${persona.legajo}`
                            : "Sin legajo"}
                        </div>

                        {persona.tipo_contratacion && (
                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-2.5 py-1
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-wide
                              text-slate-600
                            "
                          >
                            {persona.tipo_contratacion}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                </a>
              ))}
            </div>
          ) : (
            <div
              className="
                rounded-[20px]
                border border-dashed border-slate-400
                bg-white
                p-12
                text-center
              "
            >
              <Users
                size={34}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                No se encontraron personas con esos filtros.
              </p>
            </div>
          )}

        </section>

      </div>
    </main>
  );
}

function Resumen({
  icono,
  etiqueta,
  valor,
}: {
  icono: string;
  etiqueta: string;
  valor: number;
}) {
  return (
    <div
      className="
        rounded-[20px]
        border border-slate-300
        bg-white
        p-5
        shadow-[0_5px_14px_rgba(15,23,42,0.04)]
      "
    >
      <div className="flex items-center gap-4">

        <div
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-2xl
            bg-slate-50
            text-2xl
          "
        >
          {icono}
        </div>

        <div>
          <p className="text-sm text-slate-500">
            {etiqueta}
          </p>

          <p className="text-2xl font-bold">
            {valor}
          </p>
        </div>

      </div>
    </div>
  );
}

function iniciales(
  nombre: string,
  apellido: string | null
) {
  const partes = [
    nombre,
    apellido || "",
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    partes[0][0] +
    partes[partes.length - 1][0]
  ).toUpperCase();
}
