"use client";

import { useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Send,
  CalendarDays,
  ClipboardList,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Destino = "evento" | "pendiente" | "registro";

type Interpretacion = {
  destino: Destino;
  fecha: string | null;
  hora: string | null;
  titulo: string;
};

const meses: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const diasSemana: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fechaISO(fecha: Date) {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

function sumarDias(fecha: Date, dias: number) {
  const nueva = new Date(fecha);
  nueva.setDate(nueva.getDate() + dias);
  return nueva;
}

function detectarFecha(texto: string): string | null {
  const limpio = normalizar(texto);
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  if (/\bpasado mañana\b/.test(limpio)) {
    return fechaISO(sumarDias(hoy, 2));
  }

  if (/\bmañana\b/.test(limpio)) {
    return fechaISO(sumarDias(hoy, 1));
  }

  if (/\bhoy\b/.test(limpio)) {
    return fechaISO(hoy);
  }

  // 23/09/2026 - 23/09 - 23-09-2026

  const numerica = limpio.match(
    /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/
  );

  if (numerica) {
    const dia = Number(numerica[1]);
    const mes = Number(numerica[2]) - 1;

    let anio = numerica[3]
      ? Number(numerica[3])
      : hoy.getFullYear();

    if (anio < 100) {
      anio += 2000;
    }

    let fecha = new Date(anio, mes, dia);

    if (!numerica[3] && fecha < hoy) {
      fecha = new Date(anio + 1, mes, dia);
    }

    return fechaISO(fecha);
  }

  // 23 de septiembre / 23 de septiembre de 2026

  const nombresMeses = Object.keys(meses).join("|");

  const escrita = limpio.match(
    new RegExp(
      `\\b(\\d{1,2})\\s+de\\s+(${nombresMeses})(?:\\s+de\\s+(\\d{4}))?\\b`
    )
  );

  if (escrita) {
    const dia = Number(escrita[1]);
    const mes = meses[escrita[2]];

    let anio = escrita[3]
      ? Number(escrita[3])
      : hoy.getFullYear();

    let fecha = new Date(anio, mes, dia);

    if (!escrita[3] && fecha < hoy) {
      fecha = new Date(anio + 1, mes, dia);
    }

    return fechaISO(fecha);
  }

  // lunes, martes, próximo viernes, este miércoles...

  for (const [nombre, numeroDia] of Object.entries(diasSemana)) {
    if (
      limpio.includes(nombre) ||
      limpio.includes(`proximo ${nombre}`) ||
      limpio.includes(`${nombre} proximo`) ||
      limpio.includes(`este ${nombre}`)
    ) {
      let diferencia =
        (numeroDia - hoy.getDay() + 7) % 7;

      const diceEste =
        limpio.includes(`este ${nombre}`);

      if (diferencia === 0 && !diceEste) {
        diferencia = 7;
      }

      return fechaISO(
        sumarDias(hoy, diferencia)
      );
    }
  }

  return null;
}

function detectarHora(texto: string): string | null {
  const limpio = normalizar(texto);

  let coincidencia = limpio.match(
    /\ba\s+las?\s+(\d{1,2})(?::|\.)(\d{2})\b/
  );

  if (coincidencia) {
    const horas = Number(coincidencia[1]);
    const minutos = Number(coincidencia[2]);

    if (
      horas >= 0 &&
      horas <= 23 &&
      minutos >= 0 &&
      minutos <= 59
    ) {
      return `${String(horas).padStart(2, "0")}:${String(
        minutos
      ).padStart(2, "0")}:00`;
    }
  }

  coincidencia = limpio.match(
    /\b(\d{1,2})(?::|\.)(\d{2})\s*(?:hs?|horas?)?\b/
  );

  if (coincidencia) {
    const horas = Number(coincidencia[1]);
    const minutos = Number(coincidencia[2]);

    if (
      horas >= 0 &&
      horas <= 23 &&
      minutos >= 0 &&
      minutos <= 59
    ) {
      return `${String(horas).padStart(2, "0")}:${String(
        minutos
      ).padStart(2, "0")}:00`;
    }
  }

  coincidencia = limpio.match(
    /\ba\s+las?\s+(\d{1,2})\s*(?:hs?|horas?)?\b/
  );

  if (coincidencia) {
    const horas = Number(coincidencia[1]);

    if (horas >= 0 && horas <= 23) {
      return `${String(horas).padStart(2, "0")}:00:00`;
    }
  }

  coincidencia = limpio.match(
    /\b(\d{1,2})\s*(?:hs|hs\.|horas)\b/
  );

  if (coincidencia) {
    const horas = Number(coincidencia[1]);

    if (horas >= 0 && horas <= 23) {
      return `${String(horas).padStart(2, "0")}:00:00`;
    }
  }

  return null;
}

function crearTitulo(texto: string) {
  let titulo = texto
    .trim()
    .replace(
      /^(agendar|agendá|anotar|anotá|recordar|recordame|registrar|registrá)\s+/i,
      ""
    );

  titulo = titulo.split(/[.!?]/)[0];

  if (titulo.toLowerCase().includes(" para ")) {
    titulo = titulo.split(/\s+para\s+/i)[0];
  }

  if (titulo.length > 85) {
    titulo = titulo.substring(0, 82) + "...";
  }

  return titulo || "Registro";
}

function interpretar(texto: string): Interpretacion {
  const limpio = normalizar(texto);

  const fecha = detectarFecha(texto);
  const hora = detectarHora(texto);
  const titulo = crearTitulo(texto);

  const marcasDeRegistro = [
    "acordamos",
    "se acordo",
    "resolvimos",
    "se resolvio",
    "se decidio",
    "decidimos",
    "se establecio",
    "participamos",
    "surgio",
    "quedo definido",
    "quedo establecido",
    "la reunion fue",
    "reunion de hoy",
    "hoy tuvimos",
    "se hablo",
    "charlamos",
  ];

  if (
    marcasDeRegistro.some((palabra) =>
      limpio.includes(palabra)
    )
  ) {
    return {
      destino: "registro",
      fecha,
      hora,
      titulo,
    };
  }

  const palabrasEvento = [
    "reunion",
    "encuentro",
    "visita",
    "evento",
    "actividad",
    "jornada",
    "taller",
    "charla",
    "presentacion",
    "festival",
    "acto",
    "capacitacion",
    "recorrido",
    "turno",
    "cita",
    "agendar",
    "agenda",
  ];

  const palabrasPendiente = [
    "hacer",
    "enviar",
    "llamar",
    "preparar",
    "revisar",
    "confirmar",
    "gestionar",
    "pedir",
    "solicitar",
    "averiguar",
    "seguimiento",
    "conseguir",
    "definir",
    "resolver",
    "consultar",
    "verificar",
    "armar",
    "organizar",
  ];

  const tieneEvento =
    palabrasEvento.some((palabra) =>
      limpio.includes(palabra)
    );

  const tienePendiente =
    palabrasPendiente.some((palabra) =>
      limpio.includes(palabra)
    );

  if (fecha) {
    if (tieneEvento) {
      return {
        destino: "evento",
        fecha,
        hora,
        titulo,
      };
    }

    if (tienePendiente) {
      return {
        destino: "pendiente",
        fecha,
        hora,
        titulo,
      };
    }

    return {
      destino: "evento",
      fecha,
      hora,
      titulo,
    };
  }

  if (tienePendiente || tieneEvento) {
    return {
      destino: "pendiente",
      fecha: null,
      hora: null,
      titulo,
    };
  }

  return {
    destino: "registro",
    fecha: null,
    hora: null,
    titulo,
  };
}

export default function RegistroInteligente() {
  const supabase = createClient();

  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const textoBaseRef = useRef("");
  const fuenteRef =
    useRef<"audio" | "texto">("texto");

  function iniciarGrabacion() {
    setMensaje(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMensaje({
        tipo: "error",
        texto:
          "Este navegador no permite transcripción por voz. Podés escribir el registro normalmente.",
      });

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;

    textoBaseRef.current =
      texto.trim() ? texto.trim() + " " : "";

    fuenteRef.current = "audio";

    recognition.onresult = (event: any) => {
      let definitivo = "";
      let temporal = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const parte =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          definitivo += parte + " ";
        } else {
          temporal += parte;
        }
      }

      setTexto(
        textoBaseRef.current +
          definitivo +
          temporal
      );

      if (definitivo) {
        textoBaseRef.current += definitivo;
      }
    };

    recognition.onerror = () => {
      setGrabando(false);

      setMensaje({
        tipo: "error",
        texto:
          "No se pudo continuar con el micrófono.",
      });
    };

    recognition.onend = () => {
      setGrabando(false);
    };

    recognitionRef.current =
      recognition;

    recognition.start();

    setGrabando(true);
  }

  function detenerGrabacion() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setGrabando(false);
  }

  async function procesar() {
    const contenido = texto.trim();

    if (!contenido) {
      setMensaje({
        tipo: "error",
        texto:
          "Escribí o grabá algo antes de registrar.",
      });

      return;
    }

    setProcesando(true);
    setMensaje(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const resultado =
      interpretar(contenido);

    const { data: ingreso, error: errorIngreso } =
      await supabase
        .from("ingresos")
        .insert({
          tipo_fuente:
            fuenteRef.current === "audio"
              ? "audio"
              : "texto",

          titulo: resultado.titulo,

          contenido_original:
            contenido,

          resumen: contenido,

          estado: "procesado",

          metadata: {
            origen: "registro_inteligente",
            destino_detectado:
              resultado.destino,
            fecha_detectada:
              resultado.fecha,
            hora_detectada:
              resultado.hora,
            parser:
              "gestion_es_v1",
          },
        })
        .select("id")
        .single();

    if (errorIngreso || !ingreso) {
      console.error(errorIngreso);

      setMensaje({
        tipo: "error",
        texto:
          "No se pudo guardar el ingreso.",
      });

      setProcesando(false);
      return;
    }

    let entidadId: string | null =
      null;

    let errorDestino: any = null;

    if (
      resultado.destino === "evento"
    ) {
      const respuesta =
        await supabase
          .from("eventos")
          .insert({
            nombre:
              resultado.titulo,

            descripcion:
              contenido,

            fecha:
              resultado.fecha,

            hora:
              resultado.hora,

            estado:
              "pendiente",

            fuente:
              fuenteRef.current === "audio"
                ? "audio"
                : "texto",

            origen_ingreso_id:
              ingreso.id,
          })
          .select("id")
          .single();

      entidadId =
        respuesta.data?.id || null;

      errorDestino =
        respuesta.error;
    }

    if (
      resultado.destino ===
      "pendiente"
    ) {
      const respuesta =
        await supabase
          .from("pendientes")
          .insert({
            titulo:
              resultado.titulo,

            descripcion:
              contenido,

            fecha_limite:
              resultado.fecha,

            prioridad:
              "normal",

            completado:
              false,

            origen_ingreso_id:
              ingreso.id,
          })
          .select("id")
          .single();

      entidadId =
        respuesta.data?.id || null;

      errorDestino =
        respuesta.error;
    }

    if (
      resultado.destino === "registro"
    ) {
      const respuesta =
        await supabase
          .from("registros")
          .insert({
            titulo:
              resultado.titulo,

            contenido:
              contenido,

            tipo:
              fuenteRef.current === "audio"
                ? "Audio"
                : "Nota",

            origen_ingreso_id:
              ingreso.id,
          })
          .select("id")
          .single();

      entidadId =
        respuesta.data?.id || null;

      errorDestino =
        respuesta.error;
    }

    if (errorDestino) {
      console.error(errorDestino);

      setMensaje({
        tipo: "error",
        texto:
          "El ingreso se guardó, pero hubo un problema al clasificarlo.",
      });

      setProcesando(false);
      return;
    }

    await supabase
      .from("acciones_ingreso")
      .insert({
        ingreso_id:
          ingreso.id,

        tipo_accion:
          resultado.destino === "evento"
            ? "crear_evento"
            : resultado.destino ===
              "pendiente"
            ? "crear_pendiente"
            : "crear_registro",

        entidad:
          resultado.destino,

        entidad_id:
          entidadId,

        titulo:
          resultado.titulo,

        resumen:
          contenido,

        datos: {
          fecha:
            resultado.fecha,
          hora:
            resultado.hora,
          fuente:
            fuenteRef.current,
        },

        confianza:
          resultado.fecha
            ? 0.9
            : 0.8,

        requiere_revision:
          false,

        estado:
          "aplicado",
      });

    let textoResultado =
      "Guardado como registro.";

    if (
      resultado.destino === "evento"
    ) {
      textoResultado =
        "Agendado correctamente.";
    }

    if (
      resultado.destino ===
      "pendiente"
    ) {
      textoResultado =
        resultado.fecha
          ? "Pendiente con fecha guardado."
          : "Pendiente guardado.";
    }

    setMensaje({
      tipo: "ok",
      texto: textoResultado,
    });

    setTexto("");
    fuenteRef.current = "texto";

    window.dispatchEvent(
      new Event("gestion:actualizada")
    );

    setProcesando(false);
  }

  const previa =
    texto.trim()
      ? interpretar(texto)
      : null;

  return (
    <section className="rounded-2xl border border-slate-400 bg-white p-5 shadow-sm">

      <div className="flex flex-col gap-1">

        <h2 className="font-semibold text-slate-900">
          Registrar
        </h2>

        <p className="text-sm text-slate-500">
          Hablá o escribí. La app decide dónde guardarlo.
        </p>

      </div>

      <textarea
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          fuenteRef.current = "texto";
        }}
        placeholder='Ejemplo: "Reunión con Daniel mañana a las 10 en el museo"'
        rows={3}
        className="mt-4 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-cyan-600"
      />

      {previa && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">

          <span className="text-slate-500">
            Se guardará como:
          </span>

          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">

            {previa.destino === "evento" && (
              <CalendarDays size={13} />
            )}

            {previa.destino === "pendiente" && (
              <ClipboardList size={13} />
            )}

            {previa.destino === "registro" && (
              <FileText size={13} />
            )}

            {previa.destino}

          </span>

          {previa.fecha && (
            <span className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-800">
              {previa.fecha}
              {previa.hora
                ? ` · ${previa.hora.slice(
                    0,
                    5
                  )}`
                : ""}
            </span>
          )}

        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">

        {!grabando ? (
          <button
            onClick={iniciarGrabacion}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Mic size={18} />
            Grabar audio
          </button>
        ) : (
          <button
            onClick={detenerGrabacion}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white"
          >
            <MicOff size={18} />
            Detener
          </button>
        )}

        <button
          onClick={procesar}
          disabled={
            procesando ||
            !texto.trim()
          }
          className="inline-flex items-center gap-2 rounded-xl bg-[#0f2b46] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Send size={18} />
          )}

          Procesar
        </button>

      </div>

      {grabando && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
          Escuchando...
        </p>
      )}

      {mensaje && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm ${
            mensaje.tipo === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >

          {mensaje.tipo === "ok" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          {mensaje.texto}

        </div>
      )}

    </section>
  );
}
