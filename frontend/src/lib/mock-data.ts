import heroSaree1 from "@/assets/hero-saree-1.jpg";
import heroSaree2 from "@/assets/hero-saree-2.jpg";
import fabric1 from "@/assets/fabric-1.jpg";
import fabric2 from "@/assets/fabric-2.jpg";
import storefront from "@/assets/storefront.jpg";
import { slugify } from "./format";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  colors: string[];
  fabrics: string[];
  image: string;
  hoverImage: string;
  description: string;
  stock: number;
};

const baseProducts = [
  ["Banarasi Mashru Saree", "banarasi", 3899, 6999, ["Gold", "Maroon"]],
  ["Kanchipuram Pattu Elite", "kanchipuram", 5599, 9899, ["Emerald", "Wine"]],
  ["Georgette Party Drape", "georgette", 2399, 4399, ["Coral", "Pink"]],
  ["Wedding Heritage Silk", "wedding", 7499, 12999, ["Gold", "Red"]],
  ["Temple Border Weave", "banarasi", 4299, 7699, ["Copper", "Teal"]],
  ["Royal Bridal Kanjeevaram", "kanchipuram", 8199, 14999, ["Green", "Gold"]],
  ["Lightweight Office Saree", "georgette", 1899, 3299, ["Navy", "Mauve"]],
  ["Festive Zari Bloom", "wedding", 6499, 11299, ["Magenta", "Gold"]],
  ["Soft Silk Signature", "banarasi", 3199, 5899, ["Rust", "Cream"]],
  ["Classic Pattu Grandeur", "kanchipuram", 5999, 10499, ["Mustard", "Maroon"]],
  ["Daily Grace Georgette", "georgette", 1599, 2799, ["Blue", "Peach"]],
  ["Bridal Glow Edition", "wedding", 8999, 15999, ["Ruby", "Bronze"]],
] as const;

export const products: Product[] = baseProducts.map((item, index) => {
  const [name, category, price, originalPrice, colors] = item;
  const slug = slugify(`${name}-${index + 1}`);
  return {
    id: `prd-${index + 1}`,
    slug,
    name,
    category,
    price,
    originalPrice,
    rating: 4 + ((index % 7) / 10),
    reviews: 40 + index * 9,
    colors: [...colors],
    fabrics: ["Silk", index % 2 === 0 ? "Zari" : "Jacquard"],
    image: index % 3 === 0 ? heroSaree1 : index % 3 === 1 ? heroSaree2 : fabric2,
    hoverImage: index % 2 === 0 ? fabric1 : storefront,
    description:
      "Handpicked premium drape with refined weave detail and elegant festive finish for weddings, parties, and celebrations.",
    stock: 4 + (index % 8),
  };
});

export const categoryBanners = [
  { slug: "banarasi", title: "Banarasi Sarees", image: fabric1 },
  { slug: "kanchipuram", title: "Kanchipuram Pattu", image: heroSaree2 },
  { slug: "georgette", title: "Georgette Sarees", image: fabric2 },
  { slug: "wedding", title: "Wedding Collection", image: heroSaree1 },
];

export const heroSlides = [
  {
    title: "New Wedding Edit",
    subtitle: "Handwoven luxury drapes for celebrations",
    image: heroSaree1,
    cta: "/category/wedding",
  },
  {
    title: "Royal Silk Arrivals",
    subtitle: "Fresh Banarasi and Kanchipuram picks",
    image: heroSaree2,
    cta: "/category/banarasi",
  },
  {
    title: "Storewide Festival Offers",
    subtitle: "Up to 50% off on selected collections",
    image: storefront,
    cta: "/category/georgette",
  },
];

export const accountOrders = [
  { id: "ORD-2026-1001", date: "2026-05-10", total: 7398, status: "Delivered" },
  { id: "ORD-2026-0972", date: "2026-04-28", total: 5599, status: "Shipped" },
  { id: "ORD-2026-0907", date: "2026-04-09", total: 2399, status: "Processing" },
];

export const categories = ["banarasi", "kanchipuram", "georgette", "wedding"] as const;

export const getProductsByCategory = (slug: string) =>
  products.filter((product) => product.category === slug);

export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);
