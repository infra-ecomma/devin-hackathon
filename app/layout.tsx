import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevinHackathon — Ecomma",
  description: "Collabute X TheBlock hackathon entry by Ecomma",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950">{children}</body>
    </html>
  );
}
