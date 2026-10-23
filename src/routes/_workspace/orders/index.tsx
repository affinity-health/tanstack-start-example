import { createFileRoute } from "@tanstack/react-router";
import { OrderList } from "../../../features/orders/components/order-list";
export const Route = createFileRoute("/_workspace/orders/")({ component: OrdersPage });
function OrdersPage() {
  return (
    <main>
      <div className="page-heading">
        <h1>Orders</h1>
      </div>
      <OrderList />
    </main>
  );
}
