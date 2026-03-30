import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer Invoice",
  description: "View your invoice details and download your bill PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
