import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms-and-conditions")({ component: TermsPage });

function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Terms & Conditions</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">By placing an order you agree to our order processing, delivery, return, and payment terms.</p>
    </div>
  );
}
