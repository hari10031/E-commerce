import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/shop/product-card";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Search Results | Kalamandir Clone" },
      { name: "description", content: "Find sarees and collections by style, weave, and occasion." },
      { property: "og:title", content: "Search Results | Kalamandir Clone" },
      { property: "og:description", content: "Find sarees and collections by style, weave, and occasion." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const query = q.toLowerCase().trim();
  const results = query
    ? products.filter((product) => product.name.toLowerCase().includes(query) || product.category.includes(query))
    : products;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Search Results</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {query ? `${results.length} items found for “${q}”` : "Browse all products"}
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {results.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {results.length === 0 && (
        <div className="mt-10 rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No products found. <Link to="/" className="story-link">Back to home</Link>
        </div>
      )}
    </div>
  );
}
