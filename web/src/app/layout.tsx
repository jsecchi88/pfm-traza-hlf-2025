import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PFM Traza HLF 2025",
  description: "Plataforma descentralizada basada en Hyperledger Fabric para la trazabilidad completa de productos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow">
              <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
            <footer className="bg-gray-800 text-white py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:justify-between">
                  <div className="mb-6 md:mb-0">
                    <h2 className="text-lg font-bold">PFM Traza HLF 2025</h2>
                    <p className="text-sm text-gray-300 mt-2">
                      Plataforma descentralizada basada en Hyperledger Fabric para la trazabilidad completa de productos.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h2 className="font-medium text-gray-200">Enlaces rápidos</h2>
                      <ul className="mt-2 space-y-2">
                        <li>
                          <a href="/" className="text-gray-400 hover:text-white">Inicio</a>
                        </li>
                        <li>
                          <a href="/trazabilidad" className="text-gray-400 hover:text-white">Trazabilidad</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
                  <p className="text-sm text-gray-400 text-center md:text-left">
                    © {new Date().getFullYear()} PFM Traza HLF. Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
