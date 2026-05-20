import { createFileRoute, Link } from "@tanstack/react-router";
import { accountOrders } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({ component: OrdersPage });

function OrdersPage() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Order History</h2>
      <div className="mt-4 space-y-3">
        {accountOrders.map((order) => (
          <article key={order.id} className="grid gap-2 rounded-md border border-border p-4 text-sm sm:grid-cols-4 sm:items-center">
            <p className="font-medium">{order.id}</p>
            <p className="text-muted-foreground">{order.date}</p>
            <p>{formatPrice(order.total)}</p>
            <Link to="/account/orders/$orderId" params={{ orderId: order.id }} className="story-link sm:justify-self-end">View details</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
