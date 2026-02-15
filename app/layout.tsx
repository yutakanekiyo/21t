import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import "./globals.css";

export const metadata: Metadata = {
  title: "21T企画 在庫・受注管理システム",
  description: "筒状プロダクトの在庫・受注を管理するシステム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
