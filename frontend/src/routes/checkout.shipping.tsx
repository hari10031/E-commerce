import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckoutStepper } from "@/components/shop/checkout-stepper";
import { OrderSummary } from "@/components/shop/order-summary";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/checkout/shipping")({ component: ShippingPage });

function ShippingPage() {
  const navigate = useNavigate();
  const { shipping, setShipping } = useShop();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <CheckoutStepper current="shipping" />
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Shipping Method</h2>
            <label className="block rounded-md border border-border p-4">
              <input type="radio" checked={shipping === "standard"} onChange={() => setShipping("standard")} />
              <span className="ml-2 text-sm">Standard Delivery (3-5 days) - Free above ₹2,999</span>
            </label>
            <label className="block rounded-md border border-border p-4">
              <input type="radio" checked={shipping === "express"} onChange={() => setShipping("express")} />
              <span className="ml-2 text-sm">Express Delivery (1-2 days) - ₹199</span>
            </label>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate({ to: "/checkout/address" })}>Back</Button>
              <Button onClick={() => navigate({ to: "/checkout/payment" })}>Continue to payment</Button>
            </div>
          </div>
        </div>
        <OrderSummary />
      </div>
    </div>
  );
}
