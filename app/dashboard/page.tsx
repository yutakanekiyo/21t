import { getOrders } from "@/lib/actions/orders";
import { getInventory } from "@/lib/actions/inventory";
import { Dashboard } from "@/components/dashboard/dashboard";
import { DEFAULT_INVENTORY } from "@/utils/constants";

export default async function DashboardPage() {
  // Server Actionsでデータ取得
  const [orders, inventory] = await Promise.all([
    getOrders(),
    getInventory(),
  ]);

  return (
    <Dashboard
      initialOrders={orders}
      initialInventory={inventory || DEFAULT_INVENTORY}
    />
  );
}
