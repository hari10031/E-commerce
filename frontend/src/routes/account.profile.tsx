import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/account/profile")({ component: ProfilePage });

function ProfilePage() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Profile Details</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Input defaultValue="Priya Sharma" />
        <Input defaultValue="priya@example.com" />
        <Input defaultValue="+91 98765 43210" />
        <Input defaultValue="Hyderabad" />
      </div>
      <Button className="mt-4">Save changes</Button>
    </section>
  );
}
