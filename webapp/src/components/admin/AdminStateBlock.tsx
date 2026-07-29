interface Props {
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyLabel: string;
  onRetry: () => void;
}

export function AdminStateBlock({ loading, error, empty, emptyLabel, onRetry }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-white/70">
        <p className="mb-3">Couldn't load this data.</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/80 hover:bg-white/5"
        >
          Retry
        </button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/45">
        {emptyLabel}
      </div>
    );
  }
  return null;
}
