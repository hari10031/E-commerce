import { createFileRoute } from "@tanstack/react-router";
import { accountOrders, products } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/account/orders/$orderId")({ component: OrderDetailsPage });

function OrderDetailsPage() {
  const { orderId } = Route.useParams();
  const order = accountOrders.find((item) => item.id === orderId);

  if (!order) {
    return <div className="rounded-lg border border-border bg-card p-5">Order not found.</div>;
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Order {order.id}</h2>
      <p className="text-sm text-muted-foreground">Placed on {order.date} · Status: {order.status}</p>
      <div className="space-y-3">
        {products.slice(0, 2).map((product) => (
          <div key={product.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
            <span>{product.name}</span>
            <span>{formatPrice(product.price)}</span>
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold">Order total: {formatPrice(order.total)}</p>
    </section>
  );
}
