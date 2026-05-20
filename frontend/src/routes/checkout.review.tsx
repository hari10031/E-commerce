import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckoutStepper } from "@/components/shop/checkout-stepper";
import { OrderSummary } from "@/components/shop/order-summary";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/checkout/review")({ component: ReviewPage });

function ReviewPage() {
  const navigate = useNavigate();
  const { cart, address, payment, shipping, clearCheckout } = useShop();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <CheckoutStepper current="review" />
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Review your order</h2>
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">Address</p>
              <p className="text-muted-foreground">{address ? `${address.fullName}, ${address.line1}, ${address.city}` : "No address selected"}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">Shipping</p>
              <p className="text-muted-foreground capitalize">{shipping}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">Payment</p>
              <p className="text-muted-foreground uppercase">{payment}</p>
            </div>
            <div className="rounded-md border border-border p-3 text-sm">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.color}`} className="flex justify-between py-1">
                  <span>{item.product.name} × {item.qty}</span>
                  <span>₹{item.product.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate({ to: "/checkout/payment" })}>Back</Button>
              <Button
                onClick={() => {
                  clearCheckout();
                  navigate({ to: "/checkout/success", search: { id: `ORD-${Math.floor(Math.random() * 99999)}` } });
                }}
              >
                Place order
              </Button>
            </div>
          </div>
        </div>
        <OrderSummary />
      </div>
    </div>
  );
}
