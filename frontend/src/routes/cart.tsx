import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@/components/shop/order-summary";
import { formatPrice } from "@/lib/format";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart | Kalamandir Clone" },
      { name: "description", content: "Review your selected products and continue checkout." },
      { property: "og:title", content: "Cart | Kalamandir Clone" },
      { property: "og:description", content: "Review your selected products and continue checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQty, removeFromCart } = useShop();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Shopping Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
              Your cart is empty. <Link to="/" className="story-link">Continue shopping</Link>
            </div>
          ) : (
            cart.map((item) => (
              <article key={`${item.product.id}-${item.color}`} className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-[120px_1fr]">
                <img src={item.product.image} alt={item.product.name} width={240} height={320} className="h-32 w-full rounded-md object-cover" />
                <div>
                  <h2 className="font-medium">{item.product.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Color: {item.color}</p>
                  <p className="mt-2 font-semibold">{formatPrice(item.product.price)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-md border border-border">
                      <button onClick={() => updateQty(item.product.id, Math.max(1, item.qty - 1))} className="px-3 py-1">-</button>
                      <span className="px-4 py-1 text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, Math.min(10, item.qty + 1))} className="px-3 py-1">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-sm text-destructive">Remove</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="space-y-4">
          <OrderSummary />
          <Button asChild className="w-full" disabled={cart.length === 0}>
            <Link to="/checkout/address">Proceed to checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
