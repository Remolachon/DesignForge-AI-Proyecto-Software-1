'use client';
interface DataPaginationProps {
    page: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (p: number) => void;
    pageSize?: number;
}
export function DataPagination({ page, totalPages, totalItems, onPageChange, pageSize }: DataPaginationProps) {
    const hasPageSize = typeof pageSize === 'number' && pageSize > 0;

    if (totalPages <= 1 && !hasPageSize) return null;

    const range = (start: number, end: number) =>
        Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const pages =
        totalPages <= 7
            ? range(1, totalPages)
            : page <= 4
                ? [...range(1, 5), -1, totalPages]
                : page >= totalPages - 3
                    ? [1, -1, ...range(totalPages - 4, totalPages)]
                    : [1, -1, ...range(page - 1, page + 1), -1, totalPages];

        const startItem = hasPageSize && totalItems > 0 ? Math.min(totalItems, (page - 1) * pageSize + 1) : totalItems > 0 ? 1 : 0;
        const endItem = hasPageSize ? Math.min(totalItems, page * pageSize) : totalItems;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
                    {hasPageSize ? (
                        <>
                            Mostrando <span className="font-semibold text-foreground">{startItem}</span> -{' '}
                            <span className="font-semibold text-foreground">{endItem}</span> de{' '}
                            <span className="font-semibold text-foreground">{totalItems}</span> productos
                        </>
                    ) : (
                        <>
                            Página <span className="font-semibold text-foreground">{page}</span> de{' '}
                            <span className="font-semibold text-foreground">{totalPages}</span>
                            {' · '}
                            <span className="font-semibold text-foreground">{totalItems}</span> en total
                        </>
                    )}
            </p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        {pages.map((p, idx) =>
                            p === -1 ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">
                                    …
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`
                    px-3 py-1.5 rounded-lg border text-sm transition-colors
                    ${p === page ? 'bg-primary text-primary-foreground border-primary font-medium' : 'border-border bg-background hover:bg-muted'}
                  `}
                                >
                                    {p}
                                </button>
                            ),
                        )}
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
        </div>
    );
}