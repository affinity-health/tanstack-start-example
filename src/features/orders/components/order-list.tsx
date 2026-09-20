import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ordersQuery } from "../../../api/orders/queries";
import { useWorkspace } from "../../workspace/workspace-layout";

export function OrderList({
  filter,
  onFilter,
}: {
  filter: "all" | "draft";
  onFilter: (filter: "all" | "draft") => void;
}) {
  const {
    initial: { sessionId },
  } = useWorkspace();
  const query = useInfiniteQuery(ordersQuery(sessionId, filter));
  const orders = query.data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <section className="orders-view" aria-label="Orders">
      <div className="orders-controls">
        <div className="view-switch" aria-label="Filter orders">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            aria-pressed={filter === "all"}
            onClick={() => onFilter("all")}
          >
            All orders
          </Button>
          <Button
            variant={filter === "draft" ? "secondary" : "ghost"}
            aria-pressed={filter === "draft"}
            onClick={() => onFilter("draft")}
          >
            Drafts
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh orders"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={16} />
        </Button>
      </div>
      {query.error && (
        <div role="alert">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {query.isPending && (
        <p className="hint" role="status">
          Loading orders…
        </p>
      )}
      {query.isSuccess && !orders.length && (
        <p className="orders-empty">{filter === "draft" ? "No drafts yet." : "No orders yet."}</p>
      )}
      <div className="orders-list" aria-busy={query.isFetching}>
        {orders.map((item) => (
          <Link
            className="order-row"
            key={item.id}
            to="/orders/$orderId"
            params={{ orderId: item.id }}
          >
            <span className="order-row-main">
              <strong>{item.patientName}</strong>
              <span>
                {item.prescriptions
                  .map((rx) => `${rx.medicationName} ${rx.strength ?? ""}`)
                  .join(", ")}
              </span>
              <small>
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {item.patientState}
              </small>
            </span>
            <span className="order-row-status">
              <span className="order-status" data-status={item.status}>
                {item.status.replaceAll("_", " ")}
              </span>
              <ArrowUpRight size={16} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
      {query.hasNextPage && (
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more orders"}
        </Button>
      )}
    </section>
  );
}
