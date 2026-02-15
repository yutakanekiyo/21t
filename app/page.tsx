import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-8">
          <Package className="h-24 w-24 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          21T企画
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          在庫・受注管理システム
        </p>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          特殊素材を用いた筒状プロダクトの在庫と受注を一元管理。
          <br />
          底・蓋共通ロール計算で、正確な在庫予測を実現します。
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-in">
            <Button size="lg">ログイン</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline">
              新規登録
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
