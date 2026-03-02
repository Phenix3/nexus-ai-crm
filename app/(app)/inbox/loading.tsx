import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5">
        {[80, 72, 64, 60].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Email list */}
      <div className="rounded-xl border bg-white overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 px-4 py-3.5 border-b last:border-0 dark:border-zinc-800"
          >
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
