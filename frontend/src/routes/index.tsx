import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroSlider } from "@/components/shop/hero-slider";
import { ProductCard } from "@/components/shop/product-card";
import { categoryBanners, products } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kalamandir Clone | Premium Sarees" },
      { name: "description", content: "Shop premium sarees, bridal drapes, and festive collections." },
      { property: "og:title", content: "Kalamandir Clone | Premium Sarees" },
      { property: "og:description", content: "Shop premium sarees, bridal drapes, and festive collections." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <HeroSlider />

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Shop by Collection</h2>
          <Link to="/category/wedding" className="text-sm story-link">View all</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categoryBanners.map((category) => (
            <Link key={category.slug} to="/category/$slug" params={{ slug: category.slug }} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={category.image} alt={category.title} loading="lazy" width={1200} height={900} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-background/30" />
              <p className="absolute bottom-4 left-4 text-lg font-medium text-primary-foreground">{category.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Best Selling Products</h2>
          <Link to="/search" search={{ q: "best sellers" }} className="text-sm story-link">Explore</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
