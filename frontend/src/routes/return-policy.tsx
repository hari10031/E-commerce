import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/return-policy")({ component: ReturnPolicyPage });

function ReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Return Policy</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">Returns are accepted within 7 days of delivery for unused products with original packaging.</p>
    </div>
  );
}
