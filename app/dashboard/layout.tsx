import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { UserButton } from "@/components/auth/user-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">21T企画</h1>
                <p className="text-sm text-muted-foreground">
                  在庫・受注管理システム
                </p>
              </div>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* フッター */}
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 21T企画 在庫・受注管理システム</p>
        </div>
      </footer>
    </div>
  );
}
