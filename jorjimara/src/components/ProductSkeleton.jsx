export function SkeletonCard() {
    return (
        <div className="animate-pulse">
            <div className="aspect-3/4 bg-stone-100" />
            <div className="pt-3 space-y-2">
                <div className="h-3 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
            </div>
        </div>
    )
}