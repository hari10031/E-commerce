import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { ProductCard } from "@/components/shop/product-card";
import { Input } from "@/components/ui/input";
import { getProductsByCategory } from "@/lib/mock-data";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} Sarees | Kalamandir Clone` },
      { name: "description", content: `Browse ${params.slug} sarees with premium weaving and festive designs.` },
      { property: "og:title", content: `${params.slug} Sarees | Kalamandir Clone` },
      { property: "og:description", content: `Browse ${params.slug} sarees with premium weaving and festive designs.` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [query, setQuery] = useState("");
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [sort, setSort] = useState("popularity");

  const products = useMemo(() => {
    let items = getProductsByCategory(slug);

    if (query.trim()) {
      items = items.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
    }

    if (selectedFabrics.length > 0) {
      items = items.filter((product) => selectedFabrics.every((fabric) => product.fabrics.includes(fabric)));
    }

    if (sort === "price-low") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "price-high") items = [...items].sort((a, b) => b.price - a.price);
    if (sort === "new") items = [...items].reverse();

    return items;
  }, [query, selectedFabrics, slug, sort]);

  const toggleFabric = (fabric: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(fabric) ? prev.filter((item) => item !== fabric) : [...prev, fabric],
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold capitalize">{slug} Sarees</h1>
      <p className="mt-2 text-sm text-muted-foreground">Curated collection with festive and bridal-ready drapes.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebar selected={selectedFabrics} onToggle={toggleFabric} />

        <div>
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search in this category" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="popularity">Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="new">Newest</option>
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
