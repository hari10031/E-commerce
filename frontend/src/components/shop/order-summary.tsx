import { formatPrice } from "@/lib/format";
import { useShop } from "@/lib/store";

export function OrderSummary() {
  const { cart, shipping } = useShop();
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shippingCost = shipping === "express" ? 199 : subtotal > 2999 ? 0 : 99;
  const discount = subtotal > 8000 ? 800 : subtotal > 5000 ? 400 : 0;
  const total = subtotal + shippingCost - discount;

  return (
    <aside className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-base font-semibold">Order Summary</h2>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatPrice(discount)}</span></div>
        <div className="mt-3 border-t border-border pt-3 flex justify-between font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div>
      </div>
    </aside>
  );
}
