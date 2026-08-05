import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listNewsReviews,
  sendNewsReview,
  deleteNewsReview,
  type NewsReview,
} from "@/lib/organizer.functions";
import { MessageSquare, Send, Star, Crown, Trash2, RefreshCw } from "lucide-react";

export function NewsReviewChat({
  newsId,
  username,
  token,
  password,
  isOwner = false,
}: {
  newsId: string;
  username?: string;
  token?: string;
  password?: string;
  isOwner?: boolean;
}) {
  const fetchReviews = useServerFn(listNewsReviews);
  const doSend = useServerFn(sendNewsReview);
  const doDelete = useServerFn(deleteNewsReview);

  const [reviews, setReviews] = useState<NewsReview[]>([]);
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const rows = await fetchReviews({ data: { newsId } });
      setReviews((rows as NewsReview[]) ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [fetchReviews, newsId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function submit() {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setError("");
    try {
      await doSend({
        data: {
          newsId,
          ...(password ? { password } : { username, token }),
          message: msg,
          ...(rating > 0 ? { rating } : {}),
        },
      });
      setText("");
      setRating(0);
      await load();
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (e) {
      setError((e as Error).message || "Could not post your review.");
    } finally {
      setSending(false);
    }
  }

  const avg =
    reviews.filter((r) => r.rating).length > 0
      ? (
          reviews.reduce((s, r) => s + (r.rating ?? 0), 0) /
          reviews.filter((r) => r.rating).length
        ).toFixed(1)
      : null;

  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-6 shadow-lg space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
          <h3 className="truncate text-lg font-bold">Review chat for this news</h3>
        </div>
        <div className="flex items-center gap-2">
          {avg && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-500" /> {avg} / 5
            </span>
          )}
          <span className="rounded-full border bg-secondary/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
          <button
            type="button"
            onClick={load}
            title="Refresh reviews"
            className="rounded-full border bg-card p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <p className="text-xs text-muted-foreground">
        Share your opinion about this announcement only — this chat is not the global chat.
      </p>

      <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {reviews.length === 0 && (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No reviews yet. Be the first to share what you think!
          </div>
        )}
        {reviews.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl border p-3 ${
              r.is_owner ? "border-primary/40 bg-primary/5" : "bg-secondary/30"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {r.is_owner ? (
                  <Crown className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {r.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="truncate text-sm font-semibold">{r.username}</span>
                {r.rating ? (
                  <span className="flex shrink-0 items-center gap-0.5 text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-500" />
                    ))}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
                {isOwner && (
                  <button
                    type="button"
                    title="Delete review"
                    onClick={async () => {
                      if (!password) return;
                      await doDelete({ data: { password, id: r.id } });
                      await load();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{r.message}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">Your rating:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              title={`Rate ${n} / 5`}
              onClick={() => setRating(rating === n ? 0 : n)}
              className="transition-transform hover:scale-125"
            >
              <Star
                className={`h-4 w-4 ${
                  n <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="What do you think about this news?"
            maxLength={2000}
            className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={submit}
            disabled={sending || !text.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Post"}
          </button>
        </div>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    </section>
  );
}
