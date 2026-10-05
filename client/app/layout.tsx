import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "EvalForge",
  description: "AI Training & Evaluation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
           <Footer />
      </body>
    </html>
  );
}