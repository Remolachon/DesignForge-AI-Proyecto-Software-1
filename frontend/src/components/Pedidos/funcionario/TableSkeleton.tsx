export function TableSkeleton() {
    return (
        <div className="animate-pulse space-y-3 px-6 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-2/5" />
                        <div className="h-2 bg-gray-100 rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-6 bg-gray-200 rounded-full w-28" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
            ))}
        </div>
    );
}