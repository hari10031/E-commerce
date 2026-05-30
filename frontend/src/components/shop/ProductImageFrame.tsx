'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProductImageFrameProps {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  quality?: number
  /** cover = catalog cards; contain = PDP zoom frame */
  fit?: 'cover' | 'contain'
  className?: string
  onClick?: () => void
  children?: React.ReactNode
}

export function ProductImageFrame({
  src,
  alt,
  sizes = '(max-width: 640px) 50vw, 25vw',
  priority = false,
  quality = 90,
  fit = 'cover',
  className,
  onClick,
  children,
}: ProductImageFrameProps) {
  const objectClass = fit === 'cover' ? 'object-cover object-center' : 'object-contain object-center'

  const inner = (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        className={cn(objectClass, 'transition-transform duration-500')}
      />
      {children}
    </>
  )

  const frameClass = cn(
    'relative w-full aspect-[3/4] overflow-hidden bg-neutral-50',
    className
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(frameClass, 'text-left block')}>
        {inner}
      </button>
    )
  }

  return <div className={frameClass}>{inner}</div>
}
