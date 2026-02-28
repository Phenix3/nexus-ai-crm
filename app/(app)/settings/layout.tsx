import { SettingsNav } from "./_components/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-10">
      <aside className="w-44 shrink-0">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Settings
        </p>
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
