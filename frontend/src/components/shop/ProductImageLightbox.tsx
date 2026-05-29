'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const MIN_SCALE = 1
const MAX_SCALE = 4

function pinchDistance(touches: React.TouchList) {
  if (touches.length < 2) return null
  const first = touches[0]
  const second = touches[1]
  if (!first || !second) return null
  const dx = first.clientX - second.clientX
  const dy = first.clientY - second.clientY
  return Math.hypot(dx, dy)
}

function clampOffset(offset: { x: number; y: number }, scale: number) {
  if (scale <= 1) return { x: 0, y: 0 }
  const maxX = Math.max(0, ((window.innerWidth * scale) - window.innerWidth) / 2)
  const maxY = Math.max(0, ((window.innerHeight * 0.75 * scale) - window.innerHeight * 0.75) / 2)
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  }
}

interface ProductImageLightboxProps {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export function ProductImageLightbox({ src, alt, open, onClose }: ProductImageLightboxProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null)
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const mousePanRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const lastTapRef = useRef(0)
  const scaleRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })

  scaleRef.current = scale
  offsetRef.current = offset

  const clampScale = (value: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, value))

  const resetView = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (!open) return
    resetView()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, src, resetView])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const adjustScale = (delta: number) => {
    setScale((s) => {
      const next = clampScale(Number((s + delta).toFixed(2)))
      if (next <= 1) {
        setOffset({ x: 0, y: 0 })
      } else {
        setOffset((o) => clampOffset(o, next))
      }
      return next
    })
  }

  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setScale((s) => {
        const next = s > 1 ? 1 : 2.5
        if (next <= 1) setOffset({ x: 0, y: 0 })
        return next
      })
    }
    lastTapRef.current = now
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = pinchDistance(e.touches)
      if (distance) {
        pinchStartRef.current = { distance, scale: scaleRef.current }
      }
      panStartRef.current = null
      return
    }
    if (e.touches.length === 1 && scaleRef.current > 1) {
      panStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      e.preventDefault()
      const distance = pinchDistance(e.touches)
      if (!distance) return
      const next = clampScale(
        pinchStartRef.current.scale * (distance / pinchStartRef.current.distance)
      )
      setScale(next)
      if (next <= 1) {
        setOffset({ x: 0, y: 0 })
      } else {
        setOffset((o) => clampOffset(o, next))
      }
      return
    }
    if (e.touches.length === 1 && panStartRef.current && scaleRef.current > 1) {
      e.preventDefault()
      const dx = e.touches[0].clientX - panStartRef.current.x
      const dy = e.touches[0].clientY - panStartRef.current.y
      setOffset(clampOffset({
        x: panStartRef.current.ox + dx,
        y: panStartRef.current.oy + dy,
      }, scaleRef.current))
    }
  }

  const onTouchEnd = () => {
    pinchStartRef.current = null
    panStartRef.current = null
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (scaleRef.current <= 1 || e.button !== 0) return
    e.preventDefault()
    mousePanRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!mousePanRef.current || scaleRef.current <= 1) return
    e.preventDefault()
    const dx = e.clientX - mousePanRef.current.x
    const dy = e.clientY - mousePanRef.current.y
    setOffset(clampOffset({
      x: mousePanRef.current.ox + dx,
      y: mousePanRef.current.oy + dy,
    }, scaleRef.current))
  }

  const endMousePan = () => {
    mousePanRef.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.15 : -0.15
    adjustScale(delta)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 touch-none"
      role="dialog"
      aria-modal="true"
      aria-label="Product image zoom"
    >
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <p className="text-white/60 text-xs">Pinch or +/− to zoom · drag to pan · double-tap to toggle</p>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div
        className={cn(
          'flex-1 relative overflow-hidden flex items-center justify-center',
          scale > 1 && 'cursor-grab active:cursor-grabbing'
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endMousePan}
        onMouseLeave={endMousePan}
        onClick={handleDoubleTap}
      >
        <div
          className="relative w-full h-full max-w-[min(100vw,56rem)] max-h-[min(80vh,48rem)] transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain select-none pointer-events-none"
            sizes="100vw"
            quality={95}
            priority
            draggable={false}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={() => adjustScale(-0.5)}
          className="h-11 w-11 rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-white/10"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-white text-sm font-semibold tabular-nums min-w-[3.5rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => adjustScale(0.5)}
          className="h-11 w-11 rounded-full border border-white/25 text-white flex items-center justify-center hover:bg-white/10"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className={cn(
            'ml-2 px-4 py-2 rounded-full text-xs font-semibold border border-white/25 text-white/90',
            scale === 1 && offset.x === 0 && offset.y === 0 && 'opacity-40 pointer-events-none'
          )}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
