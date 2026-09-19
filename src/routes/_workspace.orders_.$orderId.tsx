import { createFileRoute } from "@tanstack/react-router";
import { OrderDetail } from "../features/prescribing/components/order-detail";
export const Route = createFileRoute("/_workspace/orders_/$orderId")({ component: Detail });
function Detail() {
  const { orderId } = Route.useParams();
  return <OrderDetail key={orderId} orderId={orderId} />;
}
