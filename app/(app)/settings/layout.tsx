import { SettingsNav } from "./_components/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-48 shrink-0">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Settings
        </p>
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1 pb-12">{children}</div>
    </div>
  );
}
