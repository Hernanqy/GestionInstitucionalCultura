"use client";

import {
  Home,
  Search,
  Plus,
  CalendarDays,
  ClipboardList,
  Building2,
  Users,
  FolderOpen,
  FileText,
  Settings,
} from "lucide-react";

import { ReactNode } from "react";

const menu = [
  { nombre: "Inicio", href: "/", icono: Home },
  { nombre: "Buscar", href: "/buscar", icono: Search },
  { nombre: "Registrar", href: "/registrar", icono: Plus },
  { nombre: "Bandeja", href: "/bandeja", icono: FileText },
  { nombre: "Agenda", href: "/agenda", icono: CalendarDays },
  { nombre: "Pendientes", href: "/pendientes", icono: ClipboardList },
  { nombre: "Dependencias", href: "/dependencias", icono: Building2 },
  { nombre: "Personal", href: "/personal", icono: Users },
  { nombre: "Documentos", href: "/documentos", icono: FolderOpen },
  { nombre: "Registros", href: "/registros", icono: FileText },
];

export default function AppShell({
  children,
  activo,
}: {
  children: ReactNode;
  activo?: string;
}) {
  return (
    <div className="flex min-h-screen bg-slate-200/80">

      <aside className="hidden w-64 shrink-0 flex-col bg-[#0f2b46] text-white lg:flex">

        <div className="border-b border-white/10 px-5 py-6">
          <h1 className="text-lg font-semibold">
            Gestión Institucional
          </h1>
        </div>

        <nav className="flex-1 space-y-1 p-3">

          {menu.map((item) => {
            const Icon = item.icono;
            const seleccionado = activo === item.nombre;

            return (
              <a
                key={item.nombre}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  seleccionado
                    ? "bg-cyan-600 text-white"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                {item.nombre}
              </a>
            );
          })}

        </nav>

        <div className="border-t border-white/10 p-4">

          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold">
              H
            </div>

            <div>
              <p className="text-sm font-medium">
                Hernán
              </p>

              <p className="text-xs text-slate-300">
                Gestión
              </p>
            </div>

          </div>

          <a
            href="/configuracion"
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <Settings size={17} />
            Configuración
          </a>

        </div>

      </aside>

      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-slate-300 bg-white lg:hidden">

        <a
          href="/"
          className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
        >
          <Home size={19} />
          Inicio
        </a>

        <a
          href="/buscar"
          className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
        >
          <Search size={19} />
          Buscar
        </a>

        <a
          href="/agenda"
          className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
        >
          <CalendarDays size={19} />
          Agenda
        </a>

        <a
          href="/dependencias"
          className="flex flex-col items-center gap-1 py-3 text-xs text-slate-600"
        >
          <Building2 size={19} />
          Espacios
        </a>

      </nav>

    </div>
  );
}

