import React from 'react'

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" aria-hidden>
      <div className="h-4 w-32 shimmer rounded mb-4" />
      <div className="h-9 w-2/3 max-w-md shimmer rounded mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] shimmer rounded-2xl" />
            <div className="h-3 w-3/4 shimmer rounded" />
            <div className="h-3 w-1/2 shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse" aria-hidden>
      <div className="h-3 w-48 shimmer rounded mb-6" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="aspect-[3/4] shimmer rounded-2xl" />
        <div className="space-y-4">
          <div className="h-4 w-24 shimmer rounded" />
          <div className="h-10 w-full shimmer rounded" />
          <div className="h-8 w-40 shimmer rounded" />
          <div className="h-24 w-full shimmer rounded-xl" />
        </div>
      </div>
    </div>
  )
}
