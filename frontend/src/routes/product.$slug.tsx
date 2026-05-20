import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getProductBySlug, products } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | Kalamandir Clone` },
      { name: "description", content: "Detailed saree view with variants, delivery info, and reviews." },
      { property: "og:title", content: `${params.slug} | Kalamandir Clone` },
      { property: "og:description", content: "Detailed saree view with variants, delivery info, and reviews." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const product = getProductBySlug(slug);
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(product?.colors[0] ?? "Gold");

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <Link to="/" className="mt-3 inline-block story-link">Return home</Link>
      </div>
    );
  }

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <img src={product.image} alt={product.name} width={900} height={1200} className="w-full rounded-lg border border-border object-cover" />
          <div className="grid grid-cols-3 gap-3">
            {[product.image, product.hoverImage, products[0]?.image].map((image, idx) => (
              <img key={idx} src={image} alt={`${product.name} view ${idx + 1}`} width={420} height={520} loading="lazy" className="rounded-md border border-border object-cover" />
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="size-4 fill-current" /> {product.rating.toFixed(1)} ({product.reviews} reviews)
          </div>
          <div className="mt-5 flex items-center gap-3 text-lg">
            <span className="font-semibold">{formatPrice(product.price)}</span>
            <span className="text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            <span className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">{discount}% OFF</span>
          </div>

          <p className="mt-5 text-sm leading-6 text-muted-foreground">{product.description}</p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Color</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((option) => (
                <button
                  key={option}
                  onClick={() => setColor(option)}
                  className={`rounded-md border px-3 py-1 text-sm ${option === color ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Quantity</p>
            <div className="inline-flex items-center rounded-md border border-border">
              <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="px-3 py-2">-</button>
              <span className="px-4 py-2">{qty}</span>
              <button onClick={() => setQty((v) => Math.min(10, v + 1))} className="px-3 py-2">+</button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => addToCart(product, color, qty)} className="min-w-40">Add to Cart</Button>
            <Button variant="outline" onClick={() => toggleWishlist(product.id)}>
              <Heart className={wishlist.includes(product.id) ? "fill-current" : ""} /> Wishlist
            </Button>
            <Button asChild variant="secondary"><Link to="/cart">Buy now</Link></Button>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card p-4 text-sm">
            <p className="font-medium">Delivery</p>
            <p className="mt-1 text-muted-foreground">Express dispatch available. Estimated delivery 2-5 working days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
