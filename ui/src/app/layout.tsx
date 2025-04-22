import type { Metadata } from "next";
import "./globals.css";

import { DashboardProvider } from '@/components/dashboard';
import { Menubar } from '@/components/menubar';

export const metadata: Metadata = {
  title: "Tariffic",
  description: "Dashboard demonstrator that puts a realistic quantity of data into recharts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body>
        <DashboardProvider>
          <header>
            <Menubar />
          </header>
          {children}
          <footer>
            <p className="disclaimer">
              World Economy Dashboard is entirely whimsical, any resemblance to past or current entities or events is purely coincidental.
            </p>
          </footer>
        </DashboardProvider>
      </body>
    </html>
  );
}
