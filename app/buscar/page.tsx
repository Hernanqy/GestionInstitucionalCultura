"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Search,
  Loader2,
  Users,
  Building2,
  CalendarDays,
  FileText,
  ChevronRight,
  BriefcaseBusiness,
  MapPin,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Persona = {
  id: string;
  nombre: string;
  apellido: string | null;
  legajo: string | null;
  cargo: string | null;
  area: string | null;
  dependencias: {
    nombre: string;
  } | null;
};

type Dependencia = {
  id: string;
  nombre: string;
  area: string | null;
};

type Evento = {
  id: string;
  nombre: string;
  fecha: string | null;
  lugar: string | null;
};

type Registro = {
  id: string;
  titulo: string | null;
  contenido: string | null;
  tipo: string | null;
};

export default function BuscarPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();

  const consultaInicial = searchParams.get("q") || "";

  const [consulta, setConsulta] = useState(consultaInicial);
  const [buscando, setBuscando] = useState(false);
  const [yaBusco, setYaBusco] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (consultaInicial.trim()) {
        buscarTodo(consultaInicial);
      }
    }

    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscarTodo(textoOriginal?: string) {
    const texto = (textoOriginal ?? consulta).trim();

    if (!texto) {
      setPersonas([]);
      setDependencias([]);
      setEventos([]);
      setRegistros([]);
      setYaBusco(false);
      return;
    }

    setBuscando(true);
    setYaBusco(true);

    const [
      personasResult,
      dependenciasResult,
      eventosResult,
      registrosResult,
    ] = await Promise.all([
      supabase
        .from("personas")
        .select(`
          id,
          nombre,
          apellido,
          legajo,
          cargo,
          area,
          dependencias (
            nombre
          )
        `)
        .eq("activo", true)
        .range(0, 999),

      supabase
        .from("dependencias")
        .select(`
          id,
          nombre,
          area
        `)
        .eq("activa", true)
        .range(0, 999),

      supabase
        .from("eventos")
        .select(`
          id,
          nombre,
          fecha,
          lugar
        `)
        .range(0, 999),

      supabase
        .from("registros")
        .select(`
          id,
          titulo,
          contenido,
          tipo
        `)
        .range(0, 999),
    ]);

    const termino = texto.toLowerCase();

    const personasFiltradas = ((personasResult.data || []) as unknown as Persona[])
      .filter((persona) => {
        const contenido = [
          persona.nombre,
          persona.apellido,
          persona.legajo,
          persona.cargo,
          persona.area,
          persona.dependencias?.nombre,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return contenido.includes(termino);
      })
      .slice(0, 20);

    const dependenciasFiltradas = (
      (dependenciasResult.data || []) as Dependencia[]
    )
      .filter((item) =>
        `${item.nombre} ${item.area || ""}`
          .toLowerCase()
          .includes(termino)
      )
      .slice(0, 20);

    const eventosFiltrados = ((eventosResult.data || []) as Evento[])
      .filter((evento) =>
        `${evento.nombre} ${evento.lugar || ""}`
          .toLowerCase()
          .includes(termino)
      )
      .slice(0, 20);

    const registrosFiltrados = ((registrosResult.data || []) as Registro[])
      .filter((registro) =>
        `${registro.titulo || ""} ${registro.contenido || ""} ${
          registro.tipo || ""
        }`
          .toLowerCase()
          .includes(termino)
      )
      .slice(0, 20);

    setPersonas(personasFiltradas);
    setDependencias(dependenciasFiltradas);
    setEventos(eventosFiltrados);
    setRegistros(registrosFiltrados);

    setBuscando(false);
  }

  function ejecutarBusqueda(e: React.FormEvent) {
    e.preventDefault();

    buscarTodo();
  }

  const total =
    personas.length +
    dependencias.length +
    eventos.length +
    registros.length;

  return (
    <main className="min-h-screen bg-[#edf4f8] pb-24 text-slate-900 lg:pb-10">

      <div className="mx-auto max-w-[1480px] px-5 py-7 md:px-8">

        {/* TITULO */}

        <section className="flex items-center gap-4">

          <div
            className="
              flex h-16 w-16
              items-center justify-center
              rounded-[20px]
              border border-blue-200
              bg-gradient-to-br
              from-blue-50 to-sky-100
              text-[38px]
              shadow-sm
            "
          >
            🔎
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Buscar
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Consultá personas, espacios, eventos y registros
            </p>
          </div>

        </section>

        {/* BUSCADOR */}

        <section
          className="
            mt-7
            rounded-[24px]
            border border-slate-300
            bg-white
            p-6
            shadow-[0_7px_20px_rgba(15,23,42,0.05)]
          "
        >
          <form
            onSubmit={ejecutarBusqueda}
            className="
              flex flex-col gap-3
              md:flex-row
              md:items-center
            "
          >

            <div
              className="
                flex flex-1
                items-center gap-3
                rounded-2xl
                border border-slate-300
                bg-slate-50
                px-5 py-4
              "
            >
              <Search
                size={21}
                className="text-slate-500"
              />

              <input
                value={consulta}
                onChange={(e) =>
                  setConsulta(e.target.value)
                }
                placeholder="Buscar persona, espacio, evento o registro..."
                autoFocus
                className="
                  w-full
                  bg-transparent
                  text-[15px]
                  text-slate-900
                  outline-none
                  placeholder:text-slate-400
                "
              />
            </div>

            <button
              type="submit"
              disabled={buscando}
              className="
                flex min-h-[55px]
                items-center justify-center
                gap-2
                rounded-2xl
                bg-[#102b43]
                px-7
                font-semibold
                text-white
                transition
                hover:bg-[#173d5e]
                disabled:opacity-50
              "
            >
              {buscando ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Buscando
                </>
              ) : (
                <>
                  <Search size={18} />
                  Buscar
                </>
              )}
            </button>

          </form>
        </section>

        {/* SIN BUSQUEDA */}

        {!yaBusco && (
          <section
            className="
              mt-6
              rounded-[22px]
              border border-dashed
              border-slate-300
              bg-white/70
              p-12
              text-center
            "
          >
            <Search
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-bold">
              ¿Qué necesitás encontrar?
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Podés buscar por nombre, legajo, cargo, dependencia,
              evento, lugar o información guardada en registros.
            </p>
          </section>
        )}

        {/* RESULTADO */}

        {yaBusco && !buscando && (
          <>

            <div className="mt-7 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Resultados
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {total} coincidencias para “{consulta}”
                </p>
              </div>
            </div>

            {total === 0 ? (
              <div
                className="
                  mt-5
                  rounded-[22px]
                  border border-dashed
                  border-slate-400
                  bg-white
                  p-12
                  text-center
                "
              >
                <Search
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm text-slate-500">
                  No encontramos información con ese término.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-6">

                {personas.length > 0 && (
                  <Grupo
                    titulo="Personal"
                    icono={Users}
                    cantidad={personas.length}
                  >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

                      {personas.map((persona) => (
                        <a
                          key={persona.id}
                          href={`/personal/${persona.id}`}
                          className="
                            group
                            rounded-2xl
                            border border-slate-300
                            bg-slate-50
                            p-4
                            transition
                            hover:border-slate-400
                            hover:bg-white
                            hover:shadow-md
                          "
                        >
                          <div className="flex items-start justify-between gap-3">

                            <div>
                              <h3 className="font-bold">
                                {persona.nombre}
                                {persona.apellido
                                  ? ` ${persona.apellido}`
                                  : ""}
                              </h3>

                              {persona.cargo && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                  <BriefcaseBusiness size={15} />
                                  {persona.cargo}
                                </div>
                              )}

                              {persona.dependencias?.nombre && (
                                <div className="mt-1 text-xs text-slate-500">
                                  {persona.dependencias.nombre}
                                </div>
                              )}

                              {persona.legajo && (
                                <div className="mt-2 text-xs text-slate-400">
                                  Legajo {persona.legajo}
                                </div>
                              )}
                            </div>

                            <ChevronRight
                              size={18}
                              className="
                                shrink-0
                                text-slate-300
                                transition
                                group-hover:translate-x-1
                                group-hover:text-slate-600
                              "
                            />

                          </div>
                        </a>
                      ))}

                    </div>
                  </Grupo>
                )}

                {dependencias.length > 0 && (
                  <Grupo
                    titulo="Dependencias"
                    icono={Building2}
                    cantidad={dependencias.length}
                  >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

                      {dependencias.map((item) => (
                        <a
                          key={item.id}
                          href={`/dependencias/${crearSlug(
                            item.nombre
                          )}`}
                          className="
                            group
                            flex items-center justify-between
                            rounded-2xl
                            border border-slate-300
                            bg-slate-50
                            p-4
                            transition
                            hover:bg-white
                            hover:shadow-md
                          "
                        >
                          <div>
                            <h3 className="font-bold">
                              {item.nombre}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {item.area ||
                                "Sin área asignada"}
                            </p>
                          </div>

                          <ChevronRight
                            size={18}
                            className="text-slate-400"
                          />
                        </a>
                      ))}

                    </div>
                  </Grupo>
                )}

                {eventos.length > 0 && (
                  <Grupo
                    titulo="Eventos"
                    icono={CalendarDays}
                    cantidad={eventos.length}
                  >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

                      {eventos.map((evento) => (
                        <a
                          key={evento.id}
                          href={`/agenda/${evento.id}`}
                          className="
                            rounded-2xl
                            border border-slate-300
                            bg-slate-50
                            p-4
                            transition
                            hover:bg-white
                            hover:shadow-md
                          "
                        >
                          <h3 className="font-bold">
                            {evento.nombre}
                          </h3>

                          {evento.fecha && (
                            <p className="mt-2 text-sm text-slate-600">
                              {formatearFecha(evento.fecha)}
                            </p>
                          )}

                          {evento.lugar && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                              <MapPin size={15} />
                              {evento.lugar}
                            </div>
                          )}
                        </a>
                      ))}

                    </div>
                  </Grupo>
                )}

                {registros.length > 0 && (
                  <Grupo
                    titulo="Registros"
                    icono={FileText}
                    cantidad={registros.length}
                  >
                    <div className="grid gap-3 md:grid-cols-2">

                      {registros.map((registro) => (
                        <a
                          key={registro.id}
                          href="/registros"
                          className="
                            rounded-2xl
                            border border-slate-300
                            bg-slate-50
                            p-4
                            transition
                            hover:bg-white
                            hover:shadow-md
                          "
                        >
                          <h3 className="font-bold">
                            {registro.titulo ||
                              "Registro sin título"}
                          </h3>

                          {registro.contenido && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {registro.contenido}
                            </p>
                          )}
                        </a>
                      ))}

                    </div>
                  </Grupo>
                )}

              </div>
            )}

          </>
        )}

      </div>
    </main>
  );
}

function Grupo({
  titulo,
  icono: Icon,
  cantidad,
  children,
}: {
  titulo: string;
  icono: React.ElementType;
  cantidad: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-[22px]
        border border-slate-300
        bg-white
        p-5
        shadow-[0_6px_18px_rgba(15,23,42,0.04)]
      "
    >
      <div className="mb-4 flex items-center gap-3">

        <div
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            bg-cyan-50
            text-cyan-700
          "
        >
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-bold">
            {titulo}
          </h2>

          <p className="text-xs text-slate-500">
            {cantidad} resultados
          </p>
        </div>

      </div>

      {children}
    </section>
  );
}

function crearSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatearFecha(fecha: string) {
  return new Date(
    `${fecha}T12:00:00`
  ).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
