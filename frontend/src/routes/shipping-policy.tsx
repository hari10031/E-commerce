import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shipping-policy")({ component: ShippingPolicyPage });

function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Shipping Policy</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">Orders are dispatched within 24 hours and delivered through trusted logistics partners across India.</p>
    </div>
  );
}
