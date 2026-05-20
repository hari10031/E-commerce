import { Link } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useShop } from "@/lib/store";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/category/banarasi", label: "Banarasi" },
  { to: "/category/kanchipuram", label: "Kanchipuram" },
  { to: "/category/georgette", label: "Georgette" },
  { to: "/category/wedding", label: "Wedding" },
  { to: "/about-us", label: "About" },
  { to: "/contact-us", label: "Contact" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { cart, wishlist } = useShop();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs tracking-wide">
          Free shipping above ₹2,999 | Festival offers live now
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur animate-fade-in">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="text-2xl font-semibold tracking-tight">
            KALAMANDIR
          </Link>

          <form action="/search" method="get" className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search sarees, fabrics, collections"
              className="pl-10"
              aria-label="Search products"
            />
          </form>

          <div className="flex items-center gap-4">
            <Link to="/wishlist" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent">
              <Heart className="size-4" />
              <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{wishlist.length}</span>
            </Link>
            <Link to="/cart" className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent">
              <ShoppingBag className="size-4" />
              <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{cart.length}</span>
            </Link>
            <Link to="/account" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent">
              <User className="size-4" />
            </Link>
          </div>
        </div>

        <nav className="border-t border-border">
          <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3 text-sm whitespace-nowrap">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="story-link"
                activeProps={{ className: cn("story-link font-semibold") }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <h2 className="text-lg font-semibold">Kalamandir</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Premium saree collections with elegant weaves for every celebration.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Help</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/shipping-policy">Shipping Policy</Link></li>
              <li><Link to="/return-policy">Return Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/account/login">Login</Link></li>
              <li><Link to="/account/register">Register</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
