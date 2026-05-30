'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Expand } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveColorHex } from '@/lib/colors'
import { useTouchDevice } from '@/hooks/use-touch-device'
import { ProductImageLightbox } from './ProductImageLightbox'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import type { ProductImage } from '@/types'

const IMAGE_QUALITY = 90

interface ImageGalleryProps {
  images: ProductImage[]
  title: string
}

function sortImages(images: ProductImage[]) {
  return [...images].sort((a, b) => {
    const primaryDiff = (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
    if (primaryDiff !== 0) return primaryDiff
    return (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
  })
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const isTouch = useTouchDevice()
  const colors = [...new Set(images.map((i) => i.color).filter(Boolean))] as string[]
  const [activeColor, setActiveColor] = useState<string | null>(colors[0] ?? null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [emblaApi, setEmblaApi] = useState<CarouselApi>()
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: 'center center',
    transform: 'scale(1)',
  })

  const shown = activeColor ? images.filter((i) => i.color === activeColor) : images
  const sorted = sortImages(shown)

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return
    setActiveIndex(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    emblaApi?.scrollTo(0, true)
    setActiveIndex(0)
  }, [activeColor, emblaApi])

  function selectColor(c: string) {
    setActiveColor(c)
    setActiveIndex(0)
  }

  function scrollTo(index: number) {
    emblaApi?.scrollTo(index)
    setActiveIndex(index)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isTouch) return
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2)',
    })
  }

  function handleMouseLeave() {
    if (isTouch) return
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
    })
  }

  function openLightbox() {
    const img = sorted[activeIndex]
    if (img?.url) setLightboxOpen(true)
  }

  if (sorted.length === 0) {
    return (
      <div className="aspect-[3/4] bg-neutral-100 rounded-none sm:rounded-2xl flex items-center justify-center w-full">
        <span className="text-6xl opacity-40">🌸</span>
      </div>
    )
  }

  const lightboxImages = sorted.map((img) => ({
    src: img.url,
    alt: img.alt_text ?? title,
  }))

  return (
    <div className="space-y-3 min-w-0 -mx-4 sm:mx-0">
      <Carousel
        setApi={setEmblaApi}
        opts={{ align: 'start', loop: false, dragFree: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {sorted.map((img, idx) => (
            <CarouselItem key={`${img.url}-${idx}`} className="pl-0 basis-full">
              <div
                role="button"
                tabIndex={0}
                onClick={openLightbox}
                onKeyDown={(e) => e.key === 'Enter' && openLightbox()}
                className={cn(
                  'relative w-full aspect-[3/4] overflow-hidden bg-neutral-50 cursor-pointer',
                  'sm:rounded-2xl sm:border sm:border-neutral-200/70',
                  !isTouch && 'group'
                )}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                aria-label={`View image ${idx + 1} of ${sorted.length}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text ?? `${title} ${idx + 1}`}
                  fill
                  className={cn(
                    'object-cover object-center transition-transform duration-150 ease-out',
                    !isTouch && 'group-hover:transition-transform'
                  )}
                  style={idx === activeIndex && !isTouch ? zoomStyle : undefined}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  quality={IMAGE_QUALITY}
                  priority={idx === 0}
                />
                {idx === activeIndex && (
                  <span className="absolute top-3 right-3 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white pointer-events-none">
                    <Expand className="h-4 w-4" />
                  </span>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {sorted.length > 1 && (
          <>
            <CarouselPrevious className="hidden md:flex left-3 border-none bg-white/90 shadow-md hover:bg-white" />
            <CarouselNext className="hidden md:flex right-3 border-none bg-white/90 shadow-md hover:bg-white" />
          </>
        )}

        {sorted.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
            {sorted.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  'rounded-full transition-all',
                  idx === activeIndex
                    ? 'h-2 w-2 bg-white shadow-sm'
                    : 'h-1.5 w-1.5 bg-white/50'
                )}
              />
            ))}
          </div>
        )}

        {sorted.length > 1 && (
          <p className="sr-only" aria-live="polite">
            Image {activeIndex + 1} of {sorted.length}
          </p>
        )}
      </Carousel>

      {colors.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap px-4 sm:px-0">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink mr-1 w-full sm:w-auto">Colour</span>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => selectColor(c)}
              className={cn(
                'flex items-center gap-1.5 pl-1 pr-3 py-1.5 min-h-[44px] rounded-full border transition-colors',
                c === activeColor
                  ? 'border-brand bg-brand-soft'
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
            >
              <span
                className="h-5 w-5 rounded-full ring-1 ring-inset ring-black/10 shrink-0"
                style={{ backgroundColor: resolveColorHex(c) }}
              />
              <span className="text-xs font-medium capitalize text-neutral-700">{c}</span>
            </button>
          ))}
        </div>
      )}

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-4 sm:px-0 snap-x snap-mandatory no-scrollbar">
          {sorted.map((img, idx) => (
            <button
              key={`thumb-${img.url}-${idx}`}
              type="button"
              onClick={() => scrollTo(idx)}
              className={cn(
                'relative w-12 sm:w-14 shrink-0 aspect-[3/4] rounded-lg overflow-hidden border-2 bg-neutral-50 snap-start',
                idx === activeIndex
                  ? 'border-brand'
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? `${title} ${idx + 1}`}
                fill
                className="object-cover object-center"
                sizes="72px"
                quality={85}
              />
            </button>
          ))}
        </div>
      )}

      <ProductImageLightbox
        images={lightboxImages}
        initialIndex={activeIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={(i) => scrollTo(i)}
      />
    </div>
  )
}
