import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  showTagline?: boolean
  href?: string
  variant?: 'light' | 'dark'
  imageClassName?: string
}

export function BrandLogo({
  className,
  showTagline = true,
  href = '/',
  variant = 'light',
  imageClassName,
}: BrandLogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5 sm:gap-3', className)}>
      <Image
        src={BRAND.logoPath}
        alt={BRAND.name}
        width={140}
        height={40}
        className={cn('h-8 sm:h-9 w-auto object-contain object-left', imageClassName)}
        priority
      />
      {showTagline && (
        <span
          className={cn(
            'hidden sm:block text-[8px] tracking-[0.32em] uppercase font-semibold',
            variant === 'dark' ? 'text-[var(--color-gold)]/80' : 'text-gold-dark'
          )}
        >
          {BRAND.tagline}
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="shrink-0 group">
        {content}
      </Link>
    )
  }

  return content
}
