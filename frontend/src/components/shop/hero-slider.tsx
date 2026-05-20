import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { heroSlides } from "@/lib/mock-data";

export function HeroSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[active];

  return (
    <section className="relative h-[70vh] min-h-[480px] overflow-hidden bg-muted">
      <img src={slide.image} alt={slide.title} width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover animate-fade-in" />
      <div className="absolute inset-0 bg-background/40" />
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
        <div className="max-w-lg text-primary-foreground animate-enter">
          <p className="text-sm uppercase tracking-[0.2em]">Kalamandir Collection</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">{slide.title}</h1>
          <p className="mt-4 text-sm md:text-base">{slide.subtitle}</p>
          <Button asChild className="mt-8">
            <a href={slide.cta}>Shop now</a>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`h-2 w-10 rounded-full transition ${idx === active ? "bg-primary" : "bg-muted"}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
