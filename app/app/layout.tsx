import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Retail KPIs — Challenge',
  description: 'Disponibilidad y Distribución Numérica',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
