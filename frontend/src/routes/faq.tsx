import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Kalamandir Clone" },
      { name: "description", content: "Frequently asked questions about shipping, returns, sizing, and orders." },
      { property: "og:title", content: "FAQ | Kalamandir Clone" },
      { property: "og:description", content: "Frequently asked questions about shipping, returns, sizing, and orders." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Frequently Asked Questions</h1>
      <Accordion type="single" collapsible className="mt-6 rounded-lg border border-border bg-card px-5">
        <AccordionItem value="shipping">
          <AccordionTrigger>How long does shipping take?</AccordionTrigger>
          <AccordionContent>Standard shipping takes 3-5 business days and express takes 1-2 business days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>Can I return discounted products?</AccordionTrigger>
          <AccordionContent>Yes, returns are accepted within 7 days if products are unused and tags are intact.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="payments">
          <AccordionTrigger>Which payment methods are available?</AccordionTrigger>
          <AccordionContent>UPI, cards, net banking wallets, and cash on delivery are available.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
