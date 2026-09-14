import { LucideIcon } from "lucide-react";

type Variante = "blue" | "green" | "purple" | "orange" | "cyan";

const estilos: Record<Variante, string> = {
  blue: "from-blue-100 to-sky-200 text-blue-600 border-blue-200",
  green: "from-emerald-100 to-teal-200 text-emerald-600 border-emerald-200",
  purple: "from-violet-100 to-fuchsia-200 text-violet-600 border-violet-200",
  orange: "from-amber-100 to-orange-200 text-orange-600 border-orange-200",
  cyan: "from-cyan-100 to-sky-200 text-cyan-700 border-cyan-200",
};

export default function IconoModulo({
  icon: Icon,
  variante = "cyan",
  size = 30,
}: {
  icon: LucideIcon;
  variante?: Variante;
  size?: number;
}) {
  return (
    <div
      className={`
        flex h-14 w-14 items-center justify-center rounded-2xl
        border bg-gradient-to-br shadow-sm
        ${estilos[variante]}
      `}
      style={{
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.95), 0 6px 14px rgba(15, 23, 42, .08)",
      }}
    >
      <Icon
        size={size}
        strokeWidth={2.2}
        className="drop-shadow-[0_1px_1px_rgba(255,255,255,.35)]"
      />
    </div>
  );
}
