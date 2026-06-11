export default function HomeLoading() {
  return (
    <div className="pb-12 w-full min-w-0">
      <div className="h-[52vh] sm:h-[60vh] md:h-[78vh] min-h-[320px] bg-neutral-100 animate-pulse" />
      <div className="page-container py-10 space-y-6">
        <div className="h-8 w-48 bg-neutral-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
