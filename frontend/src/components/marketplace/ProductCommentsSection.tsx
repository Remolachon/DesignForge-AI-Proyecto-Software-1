'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquareText, RefreshCcw, Star } from 'lucide-react';
import { toast } from 'sonner';

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
import { interactionService, type ProductReview } from '@/services/interaction.service';

interface ProductCommentsSectionProps {
  productId: number;
  productTitle: string;
  summaryRating?: number;
  summaryReviews?: number;
  allowReview?: boolean;
}

function getRole() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('role');
  }
  return null;
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(value);
        return (
          <Star
            key={index}
            className={`w-5 h-5 ${filled ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`}
          />
        );
      })}
    </div>
  );
}

export function ProductCommentsSection({
  productId,
  productTitle,
  summaryRating = 0,
  summaryReviews = 0,
  allowReview = false,
}: ProductCommentsSectionProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const canReview = allowReview && role === 'cliente';

  useEffect(() => {
    setRole(getRole());
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await interactionService.getProductReviews(productId);
      setReviews(data.items);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar los comentarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const averageRating = useMemo(() => {
    if (summaryReviews > 0) return summaryRating;
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews, summaryRating, summaryReviews]);

  const handleSaveReview = async () => {
    setSaving(true);
    try {
      await interactionService.createReview(productId, reviewRating, reviewComment.trim());
      toast.success('Valoración guardada correctamente.');
      await loadReviews();
      setReviewComment('');
      setReviewRating(5);
      setShowConfirm(false);
    } catch (error: any) {
      if (error?.message === 'AUTH_REQUIRED') {
        localStorage.setItem('redirect_after_login', `/marketplace/${productId}?review=1`);
        router.push('/login');
        return;
      }
      toast.error(error?.message || 'No se pudo guardar la valoración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="opiniones" className="mt-16 lg:mt-24 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border/50 pb-6 mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Opiniones del producto</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">{averageRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">{reviews.length} {reviews.length === 1 ? 'calificación' : 'calificaciones'}</div>
            </div>
            <StarDisplay value={averageRating} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left column: Create Review Form */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <div className="sticky top-24 bg-muted/20 p-6 rounded-2xl border border-border/50 shadow-sm">
            <h3 className="font-semibold text-lg text-foreground mb-4">¿Qué te pareció el producto?</h3>
            {!canReview && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-6">
                Solo el comprador de un pedido entregado puede dejar una valoración. Inicia sesión si realizaste una compra.
              </div>
            )}
            
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canReview) {
                  localStorage.setItem('redirect_after_login', `/marketplace/${productId}?review=1`);
                  router.push('/login');
                  return;
                }
                setShowConfirm(true);
              }}
            >
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Tu calificación</label>
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: 6 }).map((_, index) => {
                    const value = index;
                    const selected = reviewRating === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted'}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Cuéntanos más (opcional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="¿Qué te gustó más del producto? ¿Cómo fue tu experiencia?"
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <Button type="submit" className="w-full gap-2 py-6 text-base" disabled={saving}>
                <Star className="h-5 w-5" />
                Guardar valoración
              </Button>
            </form>
          </div>
        </div>

        {/* Right column: Comments List */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-foreground">Comentarios más recientes</h3>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground"
              disabled={loading}
              onClick={async () => {
                await loadReviews();
                toast.success('Comentarios actualizados.');
              }}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
              <RefreshCcw className="w-8 h-8 animate-spin" />
              <p>Cargando opiniones...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 text-center">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <MessageSquareText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">Sin opiniones aún</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Sé el primero en dejar un comentario sobre este producto y ayuda a otros clientes a decidirse.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{review.userName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <StarDisplay value={review.rating} />
                  </div>
                  {review.comment ? (
                    <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap pl-13">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="text-base italic text-muted-foreground/60 pl-13">
                      El usuario dejó una calificación sin comentario.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar valoración</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a guardar una valoración de {reviewRating} estrellas para {productTitle}.
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
    </div>
  );
}
