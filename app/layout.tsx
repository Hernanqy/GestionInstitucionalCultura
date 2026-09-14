import type { Metadata } from "next";
import "./globals.css";

import AppChrome from "@/components/layout/AppChrome";

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
        <AppChrome>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
