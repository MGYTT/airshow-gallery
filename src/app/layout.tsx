import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "AirShow Gallery — Pokazy Lotnicze",
  description: "Kolekcja zdjęć z najpiękniejszych pokazów lotniczych...",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            const d = document.documentElement;
            const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            d.setAttribute('data-theme', sys);
          })();
        `}} />
        <Navbar />
        <Analytics/>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}