import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckoutStepper } from "@/components/shop/checkout-stepper";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : "ORD-00000",
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useSearch();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <CheckoutStepper current="success" />
      <div className="mt-8 rounded-lg border border-border bg-card p-10 text-center">
        <h1 className="text-3xl font-semibold">Order Confirmed</h1>
        <p className="mt-3 text-sm text-muted-foreground">Thank you for shopping with us. Your order ID is {id}.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild><Link to="/account/orders">Track order</Link></Button>
          <Button variant="outline" asChild><Link to="/">Continue shopping</Link></Button>
        </div>
      </div>
    </div>
  );
}
