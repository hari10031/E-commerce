import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/addresses")({ component: AddressesPage });

function AddressesPage() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Saved Addresses</h2>
      <article className="mt-4 rounded-md border border-border p-4 text-sm">
        <p className="font-medium">Home</p>
        <p className="mt-1 text-muted-foreground">Priya Sharma, 10-11-12 Jubilee Hills, Hyderabad, Telangana 500033</p>
      </article>
      <Button variant="outline" className="mt-4">Add new address</Button>
    </section>
  );
}
