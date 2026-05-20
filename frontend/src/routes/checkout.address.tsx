import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckoutStepper } from "@/components/shop/checkout-stepper";
import { OrderSummary } from "@/components/shop/order-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/checkout/address")({ component: AddressPage });

function AddressPage() {
  const navigate = useNavigate();
  const { address, setAddress } = useShop();
  const [form, setForm] = useState(
    address ?? {
      fullName: "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    },
  );

  const isValid = Object.values(form).every((field) => field.trim().length >= 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <CheckoutStepper current="address" />
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Delivery Address</h2>
            <Input placeholder="Full Name" value={form.fullName} onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} />
            <Input placeholder="Address Line" value={form.line1} onChange={(e) => setForm((v) => ({ ...v, line1: e.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="City" value={form.city} onChange={(e) => setForm((v) => ({ ...v, city: e.target.value }))} />
              <Input placeholder="State" value={form.state} onChange={(e) => setForm((v) => ({ ...v, state: e.target.value }))} />
            </div>
            <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm((v) => ({ ...v, pincode: e.target.value }))} />
            <Button
              disabled={!isValid}
              onClick={() => {
                setAddress(form);
                navigate({ to: "/checkout/shipping" });
              }}
            >
              Continue to shipping
            </Button>
          </div>
        </div>
        <OrderSummary />
      </div>
    </div>
  );
}
