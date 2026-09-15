import { BRAND_NAME } from "@/lib/config";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gold/10 bg-ink/70 backdrop-blur-md supports-[backdrop-filter]:bg-ink/50">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
        <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-2.5 group">
          <span
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold text-ink font-bold text-sm shadow-glow"
            aria-hidden
          >
            ★
          </span>
          <span className="truncate text-base sm:text-lg font-semibold tracking-wide text-foreground group-hover:text-gold-bright transition">
            {BRAND_NAME}
          </span>
        </a>
        <nav className="flex shrink-0 items-center gap-2">
          <a
            href="#sponsors"
            className="inline-flex min-h-10 items-center rounded-lg px-2.5 py-2 text-xs sm:text-sm font-medium text-muted hover:text-gold-bright transition sm:px-3"
          >
            Offers
          </a>
          <a
            href="#claim"
            className="inline-flex min-h-10 items-center rounded-lg border border-gold/30 px-3 py-2 text-xs sm:text-sm font-medium text-gold-bright hover:bg-gold/10 transition sm:px-3.5"
          >
            Claim
          </a>
        </nav>
      </div>
    </header>
  );
}
