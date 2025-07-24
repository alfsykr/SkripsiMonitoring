import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AIDA64Provider } from "@/lib/aida64-context";
import { FirebaseProvider } from "@/lib/firebase-context";
import { SensorProvider } from "@/lib/firebase-sensor-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CPU Temperature Monitoring",
  description: "Advanced CPU and Room Temperature Monitoring Dashboard",
  icons: {
    icon: [
      {
        url: '/cpu.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico', // Fallback untuk browser lama
      }
    ],
    shortcut: '/cpu.svg',
    apple: '/cpu.svg', // Untuk Apple devices
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`bg-transparent ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AIDA64Provider>
            <FirebaseProvider>
              <SensorProvider>
                {children}
              </SensorProvider>
            </FirebaseProvider>
          </AIDA64Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}