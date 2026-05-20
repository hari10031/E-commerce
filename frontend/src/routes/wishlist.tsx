import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/shop/product-card";
import { products } from "@/lib/mock-data";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist | Kalamandir Clone" },
      { name: "description", content: "Save your favorite sarees for later shopping." },
      { property: "og:title", content: "Wishlist | Kalamandir Clone" },
      { property: "og:description", content: "Save your favorite sarees for later shopping." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useShop();
  const items = products.filter((product) => wishlist.includes(product.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My Wishlist</h1>
      <p className="mt-2 text-sm text-muted-foreground">{items.length} saved products</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
