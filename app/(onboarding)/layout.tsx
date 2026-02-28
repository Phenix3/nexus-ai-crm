export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      {/* Subtle radial gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40 dark:opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.511 0.262 276.966 / 0.15), transparent)",
        }}
      />
      <div className="relative w-full">{children}</div>
    </div>
  );
}
