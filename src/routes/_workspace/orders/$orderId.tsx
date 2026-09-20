import { createFileRoute } from "@tanstack/react-router";
import { OrderDetail } from "../../../features/orders/components/order-detail";
export const Route = createFileRoute("/_workspace/orders/$orderId")({ component: Detail });
function Detail() {
  const { orderId } = Route.useParams();
  return <OrderDetail key={orderId} orderId={orderId} />;
}
