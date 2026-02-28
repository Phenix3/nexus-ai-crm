import { TrendingUp } from "lucide-react";

export default function DealsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <TrendingUp className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Deals pipeline
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Visual Kanban pipeline, deal stages, revenue forecasting and AI win-probability scoring —
        coming in the next sprint.
      </p>
    </div>
  );
}
