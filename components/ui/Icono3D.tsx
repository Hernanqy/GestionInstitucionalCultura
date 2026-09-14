type Icono3DProps = {
  emoji: string;
  size?: number;
};

function codigoEmoji(emoji: string) {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-");
}

export default function Icono3D({
  emoji,
  size = 58,
}: Icono3DProps) {
  const codigo = codigoEmoji(emoji);

  return (
    <img
      src={`/icons-3d/${codigo}.webp`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="select-none object-contain"
    />
  );
}
