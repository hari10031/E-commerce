import { createFileRoute, Link } from "@tanstack/react-router";
import { accountOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/account/")({ component: AccountOverview });

function AccountOverview() {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Welcome back, Priya</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track orders, manage profile, and update your saved addresses.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/account/orders" className="text-sm story-link">View all</Link>
        </div>
        <div className="mt-4 space-y-3">
          {accountOrders.slice(0, 2).map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
              <span>{order.id}</span>
              <span>{order.date}</span>
              <span>{order.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
