import { BRAND_NAME } from "@/lib/config";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gold/10 bg-ink/70 backdrop-blur-md supports-[backdrop-filter]:bg-ink/50">
      <div className="mx-auto flex max-w-5xl items-center px-3 py-3 sm:px-6 sm:py-4">
        <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-2.5 group">
          <span
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold text-ink font-bold text-sm shadow-glow"
            aria-hidden
          >
            {"\u2605"}
          </span>
          <span className="truncate text-base sm:text-lg font-semibold tracking-wide text-foreground group-hover:text-gold-bright transition">
            {BRAND_NAME}
          </span>
        </a>
      </div>
    </header>
  );
}