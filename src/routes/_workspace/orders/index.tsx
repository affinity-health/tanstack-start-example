import { createFileRoute } from "@tanstack/react-router";
import { OrderList } from "../../../features/orders/components/order-list";
export const Route = createFileRoute("/_workspace/orders/")({
  validateSearch: (search: Record<string, unknown>): { filter?: "draft" } => ({
    filter: search.filter === "draft" ? "draft" : undefined,
  }),
  component: OrdersPage,
});
function OrdersPage() {
  const { filter } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <main>
      <div className="page-heading">
        <h1>Orders</h1>
      </div>
      <OrderList
        filter={filter ?? "all"}
        onFilter={(filter) =>
          void navigate({
            search: { filter: filter === "draft" ? "draft" : undefined },
            replace: true,
          })
        }
      />
    </main>
  );
}
