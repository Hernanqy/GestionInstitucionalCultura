"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Dependencia = {
  id: string;
  nombre: string;
};

const checklistBase = [
  "Escenario",
  "Pantalla",
  "Entelado",
  "Tarimas",
  "Sonido y luces",
  "Locutor",
  "Carpas",
  "Vallas",
  "Seguridad",
  "Ambulancias",
  "Electricidad",
  "Contenedores",
  "Catering",
  "Bomberos",
  "Control urbano",
  "Limpieza",
  "Baños Químicos",
  "Generador eléctrico",
  "Tachos de basura (Parque y paseo)",
  "Contratación artística",
  "Dispenser y Bidones",
  "Fumigación",
];

export default function NuevoEventoPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    fecha: "",
    fecha_hasta: "",
    hora: "",
    lugar: "",
    localidad: "",
    dependencia_id: "",
    responsable: "",
    expediente: "",
    descripcion: "",
    observaciones: "",
    estado: "preparacion",
  });

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data } = await supabase
        .from("dependencias")
        .select("id,nombre")
        .eq("activa", true)
        .neq("slug", "eventos")
        .order("nombre");

      setDependencias((data || []) as Dependencia[]);
    }
    cargar();
  }, [supabase]);

  function cambiar(campo: keyof typeof form, valor: string) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      setError("El nombre del evento es obligatorio.");
      return;
    }

    setGuardando(true);
    setError("");

    const { data: evento, error: errorEvento } = await supabase
      .from("eventos")
      .insert({
        nombre: form.nombre.trim(),
        fecha: form.fecha || null,
        fecha_hasta: form.fecha_hasta || null,
        hora: form.hora ? `${form.hora}:00` : null,
        lugar: form.lugar.trim() || null,
        localidad: form.localidad.trim() || null,
        dependencia_id: form.dependencia_id || null,
        responsable: form.responsable.trim() || null,
        expediente: form.expediente.trim() || null,
        descripcion: form.descripcion.trim() || null,
        observaciones: form.observaciones.trim() || null,
        estado: form.estado,
        fuente: "gestion_eventos",
        es_evento_gestion: true,
      })
      .select("id")
      .single();

    if (errorEvento || !evento) {
      console.error(errorEvento);
      setError("No se pudo crear el evento.");
      setGuardando(false);
      return;
    }

    const filas = checklistBase.map((necesidad, indice) => ({
      evento_id: evento.id,
      orden: indice + 1,
      necesidad,
      requerido: null,
      completado: false,
      fuente: "plantilla_eventos",
    }));

    const { error: errorItems } = await supabase
      .from("evento_items")
      .insert(filas);

    if (errorItems) {
      console.error(errorItems);
    }

    router.push(`/eventos/${evento.id}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-24 text-[#102b43]">
      <div className="mx-auto max-w-[980px] px-4 py-6 sm:px-6 md:px-8">
        <Link
          href="/eventos"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#102b43]"
        >
          <ArrowLeft size={17} />
          Eventos
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-extrabold md:text-3xl">Nuevo evento</h1>
          <p className="mt-1 text-sm text-slate-500">
            Se crea con una checklist base que después podés adaptar al evento.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Nombre *" value={form.nombre} onChange={(v) => cambiar("nombre", v)} />
            <Campo label="Responsable" value={form.responsable} onChange={(v) => cambiar("responsable", v)} />

            <Campo label="Fecha" type="date" value={form.fecha} onChange={(v) => cambiar("fecha", v)} />
            <Campo label="Fecha hasta" type="date" value={form.fecha_hasta} onChange={(v) => cambiar("fecha_hasta", v)} />

            <Campo label="Hora" type="time" value={form.hora} onChange={(v) => cambiar("hora", v)} />
            <Campo label="Lugar" value={form.lugar} onChange={(v) => cambiar("lugar", v)} />

            <Campo label="Localidad" value={form.localidad} onChange={(v) => cambiar("localidad", v)} />
            <Campo label="Expediente" value={form.expediente} onChange={(v) => cambiar("expediente", v)} />

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Dependencia relacionada</label>
              <select
                value={form.dependencia_id}
                onChange={(e) => cambiar("dependencia_id", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600"
              >
                <option value="">Sin dependencia específica</option>
                {dependencias.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => cambiar("estado", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600"
              >
                <option value="preparacion">En preparación</option>
                <option value="confirmado">Confirmado</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <Area label="Descripción" value={form.descripcion} onChange={(v) => cambiar("descripcion", v)} />
            <Area label="Observaciones generales" value={form.observaciones} onChange={(v) => cambiar("observaciones", v)} />
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={guardando}
              onClick={guardar}
              className="inline-flex items-center gap-2 rounded-xl bg-[#124775] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Crear evento
            </button>

            <Link
              href="/eventos"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-600"
            >
              Cancelar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600"
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-600"
      />
    </div>
  );
}