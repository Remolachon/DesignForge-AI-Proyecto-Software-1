'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquareText, RefreshCcw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { interactionService, type ProductReview } from '@/services/interaction.service';

type Mode = 'comments' | 'review';

interface ProductReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productTitle: string;
  summaryRating?: number;
  summaryReviews?: number;
  allowReview?: boolean;
  initialMode?: Mode;
  loadingProduct?: boolean;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

// Componente arreglado: usa spans en lugar de divs para evitar error de hidratación
function StarDisplay({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(value);
        return (
          <span key={index} className="inline-flex">
            <Star
              className={`w-4 h-4 ${filled ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`}
            />
          </span>
        );
      })}
    </span>
  );
}

export function ProductReviewsModal({
  open,
  onOpenChange,
  productId,
  productTitle,
  summaryRating = 0,
  summaryReviews = 0,
  allowReview = false,
  initialMode = 'comments',
  loadingProduct = false,
}: ProductReviewsModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [initialMode, open]);

  useEffect(() => {
    if (!open || loadingProduct || !productId) return;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const data = await interactionService.getProductReviews(productId);
        setReviews(data.items);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No se pudieron cargar los comentarios'));
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [open, productId, loadingProduct]);

  const averageRating = useMemo(() => {
    if (summaryReviews > 0) return summaryRating;
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews, summaryRating, summaryReviews]);

  const visibleComments = useMemo(
    () => reviews.filter((review) => Boolean(review.comment && review.comment.trim().length > 0)),
    [reviews],
  );

  const handleSaveReview = async () => {
    if (reviewRating === null) {
      setRatingError('La puntuación es obligatoria.');
      toast.error('La puntuación es obligatoria.');
      return;
    }

    setSaving(true);
    try {
      await interactionService.createReview(productId, reviewRating, reviewComment.trim());
      toast.success('Valoración guardada correctamente.');
      const refreshed = await interactionService.getProductReviews(productId);
      setReviews(refreshed.items);
      setReviewComment('');
      setReviewRating(5);
      setRatingError(null);
      setShowConfirm(false);
      onOpenChange(false);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'No se pudo guardar la valoración');
      if (message === 'AUTH_REQUIRED') {
        localStorage.setItem('redirect_after_login', `/marketplace/${productId}?review=1`);
        router.push('/login');
        return;
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[94vh] max-w-4xl flex-col overflow-hidden p-0 gap-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">{productTitle}</DialogTitle>

                <DialogDescription className="mt-1">
                  {loadingProduct
                    ? 'Preparando la valoración y cargando la información del producto...'
                    : summaryReviews > 0
                    ? 'Resumen de valoraciones del producto.'
                    : 'Todavía no hay valoraciones registradas.'}
                </DialogDescription>

                {!loadingProduct && summaryReviews > 0 && (
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {averageRating.toFixed(1)}
                    </span>

                    <StarDisplay value={averageRating} />

                    <span>({summaryReviews} valoraciones)</span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          {loadingProduct ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10 text-center">
              <div className="flex max-w-sm flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Cargando valoración...</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estamos preparando los datos del producto para mostrar la reseña.
                  </p>
                </div>
              </div>
            </div>
          ) : mode === 'comments' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-3">
                <h3 className="font-semibold text-sm text-foreground">Comentarios ({visibleComments.length})</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-8"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const data = await interactionService.getProductReviews(productId);
                      setReviews(data.items);
                      toast.success('Comentarios actualizados.');
                    } catch (error: unknown) {
                      toast.error(getErrorMessage(error, 'No se pudieron actualizar los comentarios'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <RefreshCcw className="h-3 w-3" />
                  Actualizar
                </Button>
              </div>
              <ScrollArea className="flex-1 px-6 py-5">
                {loading ? (
                  <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-muted-foreground">
                    Cargando comentarios...
                  </div>
                ) : visibleComments.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
                    <MessageSquareText className="mb-3 w-8 h-8 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Sin comentarios aún</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                      Cuando un cliente deje un comentario, aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleComments.map((review) => (
                      <article key={review.id} className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="font-medium text-foreground">{review.userName}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                          <StarDisplay value={review.rating} />
                        </div>
                        {review.comment ? (
                          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground/80">
                            Sin comentario adicional.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 pb-6">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (reviewRating === null) {
                  toast.error('La puntuación es obligatoria.');
                  return;
                }
                setShowConfirm(true);
              }}
            >
              <div className="rounded-2xl border border-border/70 bg-background p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="font-semibold text-foreground">Tu valoración</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Puntúa de 0 a 5 estrellas y deja un comentario si quieres.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Puntuación</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {Array.from({ length: 6 }).map((_, index) => {
                      const value = index;
                      const selected = reviewRating === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setReviewRating(value);
                            setRatingError(null);
                          }}
                          className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted'}`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                  {reviewRating === null && (
                    <p className="text-sm font-medium text-red-600">
                      Debes seleccionar una puntuación para guardar la valoración.
                    </p>
                  )}
                  {ratingError && <p className="text-sm font-medium text-red-600">{ratingError}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Comentario (opcional)</label>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Cuéntanos qué te pareció el producto..."
                    rows={6}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 -mx-6 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gap-2" disabled={saving}>
                    <Star className="h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar valoración'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
        </div>
      </DialogContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar valoración</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a guardar una valoración de {reviewRating ?? 0} estrellas para {productTitle}. Puedes editarla más adelante si deseas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleSaveReview();
              }}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}