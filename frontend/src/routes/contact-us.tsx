import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact-us")({
  head: () => ({
    meta: [
      { title: "Contact Us | Kalamandir Clone" },
      { name: "description", content: "Reach out for styling support, delivery updates, and order help." },
      { property: "og:title", content: "Contact Us | Kalamandir Clone" },
      { property: "og:description", content: "Reach out for styling support, delivery updates, and order help." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Contact Us</h1>
      <form className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
        <Input placeholder="Name" />
        <Input placeholder="Email" type="email" />
        <Input placeholder="Phone" />
        <Textarea placeholder="How can we help you?" rows={5} />
        <Button>Send message</Button>
      </form>
    </div>
  );
}
