import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

const links = [
  { to: "/account", label: "Overview" },
  { to: "/account/orders", label: "Orders" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/addresses", label: "Addresses" },
] as const;

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account | Kalamandir Clone" },
      { name: "description", content: "Manage profile, orders, addresses, and account settings." },
      { property: "og:title", content: "My Account | Kalamandir Clone" },
      { property: "og:description", content: "Manage profile, orders, addresses, and account settings." },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My Account</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-border bg-card p-4">
          <nav className="space-y-2 text-sm">
            {links.map((link) => (
              <Link key={link.to} to={link.to} activeProps={{ className: "block rounded-md bg-primary px-3 py-2 text-primary-foreground" }} inactiveProps={{ className: "block rounded-md px-3 py-2 hover:bg-accent" }}>
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
