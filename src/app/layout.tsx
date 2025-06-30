import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeProvider from "@/contexts/ThemeProvider";
import Header from '@/components/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Freelancer Chile - Calculadora de Tarifas",
  description: "Calcula tus tarifas como freelancer considerando impuestos chilenos, cotizaciones previsionales y gastos fijos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <html lang="es" className="transition-colors">
        <body className={`${inter.className} bg-theme-background text-theme-foreground transition-colors`}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </body>
      </html>
    </ThemeProvider>
  );
}
