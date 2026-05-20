import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckoutStepper } from "@/components/shop/checkout-stepper";
import { OrderSummary } from "@/components/shop/order-summary";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/checkout/payment")({ component: PaymentPage });

function PaymentPage() {
  const navigate = useNavigate();
  const { payment, setPayment } = useShop();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <CheckoutStepper current="payment" />
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Payment Method</h2>
            {[
              ["upi", "UPI / Wallet"],
              ["card", "Credit / Debit Card"],
              ["cod", "Cash on Delivery"],
            ].map(([value, label]) => (
              <label key={value} className="block rounded-md border border-border p-4">
                <input
                  type="radio"
                  checked={payment === value}
                  onChange={() => setPayment(value as "upi" | "card" | "cod")}
                />
                <span className="ml-2 text-sm">{label}</span>
              </label>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate({ to: "/checkout/shipping" })}>Back</Button>
              <Button onClick={() => navigate({ to: "/checkout/review" })}>Review order</Button>
            </div>
          </div>
        </div>
        <OrderSummary />
      </div>
    </div>
  );
}
