"use client";

import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusCircle,
  CalendarDays,
  CheckSquare,
  Layers3,
  Users,
  FolderOpen,
  Database,
  BarChart3,
  Settings,
} from "lucide-react";

const menu = [
  { nombre: "Inicio", href: "/", icono: Home },
  { nombre: "Buscar", href: "/buscar", icono: Search },
  { nombre: "Registrar", href: "/registrar", icono: PlusCircle },
  { nombre: "Agenda", href: "/agenda", icono: CalendarDays },
  { nombre: "Pendientes", href: "/pendientes", icono: CheckSquare },
  { nombre: "Dependencias", href: "/dependencias", icono: Layers3 },
  { nombre: "Personal", href: "/personal", icono: Users },
  { nombre: "Documentos", href: "/documentos", icono: FolderOpen },
  { nombre: "Registros", href: "/registros", icono: Database },
  { nombre: "Informes", href: "/informes", icono: BarChart3 },
];

export default function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#edf4f8]">

      {/* SIDEBAR PC */}

      <aside
        className="
          fixed inset-y-0 left-0 z-50
          hidden w-[245px]
          flex-col
          bg-[#102b43]
          text-white
          lg:flex
        "
      >
        <div className="px-7 pb-6 pt-8">
          <div
            className="
              flex h-11 w-11
              items-center justify-center
              rounded-2xl
              bg-white/10
              text-xl
            "
          >
            ◒
          </div>

          <h1 className="mt-4 text-[22px] font-bold leading-6">
            Gestión
            <br />
            Institucional
          </h1>

          <p
            className="
              mt-3 text-[10px]
              font-semibold uppercase
              tracking-[0.28em]
              text-slate-400
            "
          >
            Cultura · Olavarría
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {menu.map((item) => {
            const Icon = item.icono;

            const activo =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <a
                key={item.nombre}
                href={item.href}
                className={`
                  flex items-center gap-3
                  rounded-xl
                  px-4 py-3
                  text-[14px]
                  transition-all
                  ${
                    activo
                      ? "bg-cyan-600 text-white shadow-md"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <Icon
                  size={20}
                  strokeWidth={2}
                />

                <span>{item.nombre}</span>
              </a>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-5">

          <a
            href="/configuracion"
            className={`
              flex items-center gap-3
              rounded-xl
              px-4 py-3
              text-sm
              transition
              ${
                pathname.startsWith("/configuracion")
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            <Settings size={20} />
            Configuración
          </a>


        </div>
      </aside>

      {/* CONTENIDO */}

      <div className="min-h-screen lg:pl-[245px]">
        {children}
      </div>

      {/* MENÚ MÓVIL: una sola navegación global, sin duplicarla en cada pantalla */}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-4">
          <MobileItem
            href="/"
            nombre="Inicio"
            icono={Home}
            pathname={pathname}
          />

          <MobileItem
            href="/todo"
            nombre="TODO"
            icono={CheckSquare}
            pathname={pathname}
          />

          <MobileItem
            href="/agenda"
            nombre="Agenda"
            icono={CalendarDays}
            pathname={pathname}
          />

          <MobileItem
            href="/personal"
            nombre="Personal"
            icono={Users}
            pathname={pathname}
          />
        </div>
      </nav>

    </div>
  );
}

function MobileItem({
  href,
  nombre,
  icono: Icon,
  pathname,
}: {
  href: string;
  nombre: string;
  icono: React.ElementType;
  pathname: string;
}) {
  const activo =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (
    <a
      href={href}
      className={`
        flex flex-col items-center
        justify-center gap-1
        py-2.5
        text-[10px]
        font-medium
        ${
          activo
            ? "text-cyan-700"
            : "text-slate-500"
        }
      `}
    >
      <Icon
        size={20}
        strokeWidth={activo ? 2.4 : 2}
      />

      {nombre}
    </a>
  );
}
