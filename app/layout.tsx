import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F2F Text Adventure",
  description: "A web-based text adventure game powered by F2F-Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
