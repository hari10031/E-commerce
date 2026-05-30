import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { BRAND } from '@/lib/brand'

const SHOP_LINKS = [
  { href: '/products?type=saree', label: 'Sarees' },
  { href: '/products?type=jewellery', label: 'Jewellery' },
  { href: '/products', label: 'All Collections' },
]

const ACCOUNT_LINKS = [
  { href: '/orders', label: 'Track Orders' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/cart', label: 'Shopping Bag' },
  { href: '/login', label: 'Sign In' },
]

const ASSURANCES = [
  { icon: Truck, label: 'Free shipping above ₹999' },
  { icon: ShieldCheck, label: '100% authentic weaves' },
  { icon: RotateCcw, label: '7-day easy returns' },
]

export function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] text-neutral-400 mt-12 sm:mt-20 pb-safe w-full min-w-0 overflow-x-hidden">
      {/* Assurance bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ASSURANCES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-3 text-sm">
              <Icon className="h-5 w-5 text-[var(--color-gold)]" />
              <span className="text-neutral-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-5">
            <Image
              src={BRAND.logoPath}
              alt={BRAND.name}
              width={200}
              height={48}
              className="h-10 w-auto object-contain object-left brightness-110"
            />
            <div className="gold-rule w-16 my-4" />
            <p className="text-sm leading-relaxed text-neutral-400 max-w-sm">
              Celebrating India&apos;s textile heritage — handwoven sarees, designer
              ensembles, and temple-gold jewellery, curated with care and delivered
              to your doorstep.
            </p>
          </div>

          {/* Shop */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-[0.18em] mb-5">
              Shop
            </h3>
            <ul className="space-y-3 text-sm">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[var(--color-gold)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-[0.18em] mb-5">
              Account
            </h3>
            <ul className="space-y-3 text-sm">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[var(--color-gold)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 md:col-span-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-[0.18em] mb-5">
              Get in Touch
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[var(--color-gold)] shrink-0" />
                {BRAND.email}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[var(--color-gold)] shrink-0" />
                +91 98765 43210
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[var(--color-gold)] shrink-0 mt-0.5" />
                <span>Kanchipuram, Tamil Nadu, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500">
            Crafted with care for India&apos;s artisans.
          </p>
        </div>
      </div>
    </footer>
  )
}
