"use client";

import {
  Search,
  UserRound,
  BriefcaseBusiness,
  Clock3,
  Building2,
  Loader2,
  ChevronRight,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  legajo: string | null;
  cargo: string | null;
  tipo_contratacion: string | null;
  horas: string | null;
  area: string | null;

  dependencia: {
    id: string;
    nombre: string;
  } | null;
};

export default function PersonalPage() {
  const supabase = createClient();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [buscar, setBuscar] = useState("");
  const [area, setArea] = useState("Todas");
  const [cargando, setCargando] = useState(true);

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
        .from("personas")
        .select(`
          id,
          nombre,
          apellido,
          legajo,
          cargo,
          tipo_contratacion,
          horas,
          area,
          dependencia:dependencias(
            id,
            nombre
          )
        `)
        .eq("activo", true)
        .order("nombre");

      if (!error) {
        setPersonas(
          (data || []) as unknown as Persona[]
        );
      }

      setCargando(false);
    }

    cargar();
  }, []);

  const areas = useMemo(() => {
    const lista = personas
      .map((persona) => persona.area)
      .filter(
        (valor): valor is string =>
          Boolean(valor)
      );

    return [
      "Todas",
      ...Array.from(new Set(lista)).sort(),
    ];
  }, [personas]);

  const resultado = useMemo(() => {
    const texto = buscar
      .trim()
      .toLowerCase();

    return personas.filter((persona) => {
      const contenido = [
        persona.nombre,
        persona.apellido,
        persona.legajo,
        persona.cargo,
        persona.tipo_contratacion,
        persona.area,
        persona.dependencia?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideTexto =
        contenido.includes(texto);

      const coincideArea =
        area === "Todas" ||
        persona.area === area;

      return coincideTexto && coincideArea;
    });
  }, [personas, buscar, area]);

  return (
    <AppShell activo="Personal">

      <header className="border-b border-slate-300 bg-white">
        <div className="px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold text-slate-900">
            Personal
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-4 md:px-8 md:py-6">

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-400 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Personal activo
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {personas.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-400 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
              Resultados
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {resultado.length}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-400 bg-white p-4 shadow-sm md:col-span-1">
            <p className="text-sm text-slate-500">
              Áreas
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
              {Math.max(0, areas.length - 1)}
            </p>
          </div>

        </section>

        <section className="mt-4 rounded-2xl border border-slate-400 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">

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
                placeholder="Buscar nombre, legajo, función o dependencia..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

            </div>

            <select
              value={area}
              onChange={(e) =>
                setArea(e.target.value)
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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

        </section>

        {cargando ? (
          <div className="flex min-h-60 items-center justify-center">

            <Loader2
              className="animate-spin"
              size={24}
            />

          </div>
        ) : (
          <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">

            {resultado.map((persona) => (

              <a
                key={persona.id}
                href={`/personal/${persona.id}`}
                className="group block rounded-2xl border border-slate-400 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-md"
              >

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                    <UserRound size={20} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <h2 className="font-semibold text-slate-900">
                        {persona.nombre}
                        {persona.apellido
                          ? ` ${persona.apellido}`
                          : ""}
                      </h2>

                      <ChevronRight
                        size={18}
                        className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-700"
                      />

                    </div>

                    {persona.cargo && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">

                        <BriefcaseBusiness size={15} />

                        {persona.cargo}

                      </div>
                    )}

                    {persona.dependencia?.nombre && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">

                        <Building2 size={15} />

                        {persona.dependencia.nombre}

                      </div>
                    )}

                    {persona.horas && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">

                        <Clock3 size={15} />

                        {persona.horas}

                      </div>
                    )}

                    {persona.legajo && (
                      <p className="mt-3 text-xs text-slate-400">
                        Legajo {persona.legajo}
                      </p>
                    )}

                  </div>

                </div>

              </a>

            ))}

          </section>
        )}

      </div>

    </AppShell>
  );
}
