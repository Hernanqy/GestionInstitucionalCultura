"use client";

import {
  ArrowLeft,
  Building2,
  Users,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  FileText,
  Search,
  UserRound,
  Clock3,
  BriefcaseBusiness,
  Loader2,
} from "lucide-react";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  tipo_contratacion: string | null;
  horas: string | null;
  legajo: string | null;
};

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
  responsable: string | null;
};

const tabs = [
  "Resumen",
  "Personal",
  "Agenda",
  "Pendientes",
  "Documentos",
  "Registros",
];

function crearSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function DependenciaDetallePage() {
  const params = useParams();
  const slug = String(params.slug || "");
  const supabase = createClient();

  const [dependencia, setDependencia] = useState<Dependencia | null>(null);
  const [personal, setPersonal] = useState<Persona[]>([]);
  const [tab, setTab] = useState("Resumen");
  const [buscar, setBuscar] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: deps } = await supabase
        .from("dependencias")
        .select("id,nombre,area,responsable")
        .eq("activa", true);

      const encontrada = (deps || []).find(
        (item) => crearSlug(item.nombre) === slug
      );

      if (!encontrada) {
        setCargando(false);
        return;
      }

      setDependencia(encontrada);

      const { data: personas } = await supabase
        .from("personas")
        .select(`
          id,
          nombre,
          apellido,
          cargo,
          tipo_contratacion,
          horas,
          legajo
        `)
        .eq("dependencia_id", encontrada.id)
        .eq("activo", true)
        .order("nombre");

      setPersonal(personas || []);
      setCargando(false);
    }

    cargarDatos();
  }, [slug]);

  const personalFiltrado = useMemo(() => {
    const texto = buscar.toLowerCase().trim();

    return personal.filter((persona) => {
      const contenido = [
        persona.nombre,
        persona.apellido,
        persona.cargo,
        persona.legajo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [buscar, personal]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-300">
        <Loader2 size={25} className="animate-spin text-black" />
      </main>
    );
  }

  if (!dependencia) {
    return (
      <main className="min-h-screen bg-slate-300 p-8 text-black">
        <p>Dependencia no encontrada.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-300 text-black">
      <div className="mx-auto max-w-[1500px] px-5 py-6">

        <a
          href="/dependencias"
          className="mb-5 inline-flex items-center gap-2 font-medium text-black"
        >
          <ArrowLeft size={18} />
          Dependencias
        </a>

        <section className="rounded-2xl border border-slate-900 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Building2 size={27} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-black">
                  {dependencia.nombre}
                </h1>

                <p className="mt-2 font-medium text-black">
                  {dependencia.area || "Sin área asignada"}
                </p>

                {dependencia.responsable && (
                  <p className="mt-1 text-sm text-black">
                    Responsable:{" "}
                    <strong>{dependencia.responsable}</strong>
                  </p>
                )}
              </div>

            </div>

            <div className="flex gap-3">

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Personal</p>
                <p className="text-xl font-bold text-black">
                  {personal.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Eventos</p>
                <p className="text-xl font-bold text-black">0</p>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Pendientes</p>
                <p className="text-xl font-bold text-black">0</p>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-100 px-5 py-3">
                <p className="text-xs text-black">Registros</p>
                <p className="text-xl font-bold text-black">0</p>
              </div>

            </div>

          </div>

        </section>

        <div className="mt-5 flex flex-wrap gap-2">

          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl border border-slate-900 px-4 py-2.5 font-medium ${
                tab === item
                  ? "bg-slate-900 text-white"
                  : "bg-white text-black"
              }`}
            >
              {item}
            </button>
          ))}

        </div>

        {tab === "Resumen" && (
          <section className="mt-5 grid gap-4 md:grid-cols-3">

            <button
              onClick={() => setTab("Personal")}
              className="rounded-2xl border border-slate-900 bg-white p-5 text-left"
            >
              <Users size={21} className="text-cyan-700" />

              <h2 className="mt-3 font-bold text-black">
                Personal
              </h2>

              <p className="mt-2 text-3xl font-bold text-black">
                {personal.length}
              </p>
            </button>

            <button
              onClick={() => setTab("Agenda")}
              className="rounded-2xl border border-slate-900 bg-white p-5 text-left"
            >
              <CalendarDays size={21} className="text-cyan-700" />

              <h2 className="mt-3 font-bold text-black">
                Agenda
              </h2>
            </button>

            <button
              onClick={() => setTab("Pendientes")}
              className="rounded-2xl border border-slate-900 bg-white p-5 text-left"
            >
              <ClipboardList size={21} className="text-cyan-700" />

              <h2 className="mt-3 font-bold text-black">
                Pendientes
              </h2>
            </button>

          </section>
        )}

        {tab === "Personal" && (
          <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-lg font-bold text-black">
                  Personal
                </h2>

                <p className="text-sm text-black">
                  {personal.length} personas
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-900 bg-white px-4 py-3">

                <Search size={18} />

                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-transparent text-black outline-none placeholder:text-black md:w-56"
                />

              </div>

            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">

              {personalFiltrado.map((persona) => (
                <a
                  key={persona.id}
                  href={`/personal/${persona.id}`}
                  className="relative z-10 block cursor-pointer rounded-xl border border-slate-900 bg-slate-100 p-4 text-black transition hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-md"
                  title={`Abrir ficha de ${persona.nombre}`}
                >
                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
                      <UserRound size={20} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <h3 className="text-black font-bold">
                        {persona.nombre}
                        {persona.apellido ? ` ${persona.apellido}` : ""}
                      </h3>

                      {persona.cargo && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-black">
                          <BriefcaseBusiness size={15} />
                          <span>{persona.cargo}</span>
                        </div>
                      )}

                      {persona.horas && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-black">
                          <Clock3 size={15} />
                          <span>{persona.horas}</span>
                        </div>
                      )}

                      {persona.tipo_contratacion && (
                        <p className="mt-2 text-xs font-semibold uppercase text-black">
                          {persona.tipo_contratacion}
                        </p>
                      )}

                      {persona.legajo && (
                        <p className="mt-2 text-xs font-medium text-black">
                          Legajo {persona.legajo}
                        </p>
                      )}

                    </div>

                    <div className="shrink-0 text-xl font-bold text-sky-700">
                      ›
                    </div>

                  </div>
                </a>
              ))}

            </div>

          </section>
        )}

        {tab === "Agenda" && (
          <Seccion
            icono={CalendarDays}
            titulo="Agenda"
          />
        )}

        {tab === "Pendientes" && (
          <Seccion
            icono={ClipboardList}
            titulo="Pendientes"
          />
        )}

        {tab === "Documentos" && (
          <Seccion
            icono={FolderOpen}
            titulo="Documentos"
          />
        )}

        {tab === "Registros" && (
          <Seccion
            icono={FileText}
            titulo="Registros"
          />
        )}

      </div>
    </main>
  );
}

function Seccion({
  icono: Icon,
  titulo,
}: {
  icono: React.ElementType;
  titulo: string;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-slate-900 bg-white p-6">

      <div className="flex items-center gap-3">
        <Icon size={21} className="text-cyan-700" />

        <h2 className="font-bold text-black">
          {titulo}
        </h2>
      </div>

      <div className="mt-5 rounded-xl border border-dashed border-slate-900 p-10 text-center">
        <p className="text-black">
          Sin información cargada.
        </p>
      </div>

    </section>
  );
}



