import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "../../../components/ui/button";
import { useWorkspace } from "../../workspace/workspace-layout";
import { orderQuery } from "../../../api/orders/queries";
export function OrderDetail({ orderId }: { orderId: string }) {
  const {
    initial: { sessionId },
  } = useWorkspace();
  const query = useQuery(orderQuery(sessionId, orderId));
  const order = query.data;
  return (
    <main>
      <Link to="/orders">Back to orders</Link>
      <div className="page-heading">
        <h1>Order details</h1>
      </div>
      {query.isPending && <p role="status">Loading order…</p>}
      {query.error && (
        <div role="alert">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {order && (
        <div className="order-detail">
          <p>
            {order.patient.firstName} {order.patient.lastName} · {order.patient.address.state} ·
            Test mode
          </p>
          <p className="hint">
            {order.status} · {order.id}
          </p>
          {order.failureReason && <p role="alert">{order.failureReason}</p>}
          {order.prescriptions.map((rx) => (
            <div className="saved-prescription order-review" key={rx.id}>
              <h3>
                {rx.medication.name} {rx.medication.strength}
              </h3>
              <p className="hint">{order.pharmacy.name}</p>
              <p className="review-directions">{rx.directions}</p>
              <p>
                Quantity {rx.quantity} {rx.medication.quantityUnit} · Refills {rx.refills}
              </p>
              {rx.compoundingReason && <p>{rx.compoundingReason}</p>}
            </div>
          ))}
          <div className="review-delivery">
            <span className="hint">Deliver to</span>
            <p>{Object.values(order.patient.address).filter(Boolean).join(", ")}</p>
            <p>Born {order.patient.dateOfBirth}</p>
          </div>
          {order.prescriber && (
            <p>
              Prescriber: {order.prescriber.firstName} {order.prescriber.lastName} · NPI{" "}
              {order.prescriber.npi}
            </p>
          )}
          <details className="review-details">
            <summary>Full order details</summary>
            <pre tabIndex={0}>{JSON.stringify(order, null, 2)}</pre>
          </details>
        </div>
      )}
    </main>
  );
}
