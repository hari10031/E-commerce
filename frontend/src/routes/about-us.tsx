import { createFileRoute } from "@tanstack/react-router";
import storefront from "@/assets/storefront.jpg";

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: "About Us | Kalamandir Clone" },
      { name: "description", content: "Learn about our textile heritage and premium saree collections." },
      { property: "og:title", content: "About Us | Kalamandir Clone" },
      { property: "og:description", content: "Learn about our textile heritage and premium saree collections." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center">
      <img src={storefront} alt="Boutique storefront" width={1408} height={960} className="rounded-lg border border-border object-cover" />
      <div>
        <h1 className="text-3xl font-semibold">Our Story</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          We curate premium sarees inspired by heritage weaves and modern festive style. Every drape is selected
          for craftsmanship, color depth, and occasion-ready elegance.
        </p>
      </div>
    </div>
  );
}
