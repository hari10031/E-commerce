import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/mock-data";
import { useShop } from "@/lib/store";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const liked = wishlist.includes(product.id);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block aspect-[3/4] overflow-hidden">
        <img src={product.image} alt={product.name} loading="lazy" width={640} height={860} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <img src={product.hoverImage} alt={`${product.name} alternate`} loading="lazy" width={640} height={860} className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
        <Badge className="absolute left-3 top-3">-{discount}%</Badge>
      </Link>
      <div className="space-y-3 p-4">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="line-clamp-1 text-sm font-medium hover:underline">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          <span className="text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1" onClick={() => addToCart(product, product.colors[0])}>
            <ShoppingCart className="size-4" /> Add
          </Button>
          <Button size="icon" variant="outline" onClick={() => toggleWishlist(product.id)}>
            <Heart className={liked ? "fill-current" : ""} />
          </Button>
        </div>
      </div>
    </article>
  );
}
