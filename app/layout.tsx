import "./globals.css";
import { ReactNode } from "react";
import { EnvProvider } from "@/components/env-provider";

export const metadata = { title: "Organisation summary" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EnvProvider>
          {children}
        </EnvProvider>
      </body>
    </html>
  );
}
