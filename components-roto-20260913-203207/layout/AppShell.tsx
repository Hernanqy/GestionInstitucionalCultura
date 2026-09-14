"use client";

import {
  Home,
  Search,
  PlusCircle,
  CalendarDays,
  ClipboardList,
  Building2,
  Users,
  FolderOpen,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Buscar", href: "/buscar", icon: Search },
  { name: "Registrar", href: "/registrar", icon: PlusCircle },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Pendientes", href: "/pendientes", icon: ClipboardList },
  { name: "Dependencias", href: "/dependencias", icon: Building2 },
  { name: "Personal", href: "/personal", icon: Users },
  { name: "Documentos", href: "/documentos", icon: FolderOpen },
  { name: "Registros", href: "/registros", icon: FileText },
  { name: "Informes", href: "/informes", icon: BarChart3 },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  async function cerrarSesion() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#e9eef4] text-slate-950">

      {/* SIDEBAR DESKTOP */}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[250px] flex-col bg-[#071d31] text-white lg:flex">

        <div className="border-b border-white/10 px-6 py-6">

          <h1 className="text-[17px] font-bold">
            Gestión Institucional
          </h1>

          <p className="mt-1 text-[11px] text-slate-400">
            Gestión interna
          </p>

        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">

          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/" &&
                pathname.startsWith(item.href));

            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-cyan-500/90 text-white shadow-md"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />

                {item.name}
              </a>
            );
          })}

        </nav>

        <div className="border-t border-white/10 p-4">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-semibold">
              H
            </div>

            <div>
              <p className="text-sm font-medium">
                Hernán
              </p>

              <p className="text-xs text-slate-400">
                Administrador
              </p>
            </div>

          </div>

          <a
            href="/configuracion"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <Settings size={17} />
            Configuración
          </a>

          <button
            onClick={cerrarSesion}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>

        </div>

      </aside>

      {/* MOBILE HEADER */}

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">

        <div>

          <h1 className="font-semibold">
            Gestión Institucional
          </h1>

          <p className="text-[10px] text-slate-500">
            Gestión interna
          </p>

        </div>

        <div className="flex items-center gap-2">

          <button className="rounded-lg p-2 text-slate-500">
            <Bell size={19} />
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-700"
          >
            <Menu size={22} />
          </button>

        </div>

      </header>

      {/* MOBILE MENU */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">

          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute right-0 top-0 flex h-full w-[290px] flex-col bg-[#071d31] text-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/10 p-5">

              <span className="font-semibold">
                Menú
              </span>

              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
              >
                <X size={20} />
              </button>

            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">

              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
                  >
                    <Icon size={18} />

                    {item.name}
                  </a>
                );
              })}

            </nav>

          </aside>

        </div>
      )}

      {/* CONTENIDO */}

      <div className="lg:pl-[250px]">

        <div className="min-h-screen">
          {children}
        </div>

      </div>

      {/* MOBILE NAV */}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-lg lg:hidden">

        <div className="grid grid-cols-5">

          <MobileItem
            href="/"
            icon={Home}
            text="Inicio"
            active={pathname === "/"}
          />

          <MobileItem
            href="/buscar"
            icon={Search}
            text="Buscar"
            active={pathname.startsWith("/buscar")}
          />

          <MobileItem
            href="/registrar"
            icon={PlusCircle}
            text="Registrar"
            active={pathname.startsWith("/registrar")}
          />

          <MobileItem
            href="/agenda"
            icon={CalendarDays}
            text="Agenda"
            active={pathname.startsWith("/agenda")}
          />

          <MobileItem
            href="/dependencias"
            icon={Building2}
            text="Espacios"
            active={pathname.startsWith("/dependencias")}
          />

        </div>

      </nav>

    </div>
  );
}

function MobileItem({
  href,
  icon: Icon,
  text,
  active,
}: {
  href: string;
  icon: React.ElementType;
  text: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
        active
          ? "text-cyan-600"
          : "text-slate-500"
      }`}
    >
      <Icon size={19} />
      {text}
    </a>
  );
}
