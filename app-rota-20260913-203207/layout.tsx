import type { Metadata } from "next";
import "./globals.css";

import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Gestión Institucional",
  description: "Sistema interno de gestión institucional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
