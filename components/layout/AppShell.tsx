"use client";

export default function AppShell({
  children,
  activo,
}: {
  children: React.ReactNode;
  activo?: string;
}) {
  return <>{children}</>;
}
