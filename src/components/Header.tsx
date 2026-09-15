import { BRAND_NAME } from "@/lib/config";

export default function Header() {
  return (
    <header className="relative z-10 border-b border-gold/10 bg-ink/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 group">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold text-ink font-bold text-sm shadow-glow"
            aria-hidden
          >
            ★
          </span>
          <span className="text-lg font-semibold tracking-wide text-foreground group-hover:text-gold-bright transition">
            {BRAND_NAME}
          </span>
        </a>
        <a
          href="#claim"
          className="rounded-lg border border-gold/30 px-3.5 py-1.5 text-sm font-medium text-gold-bright hover:bg-gold/10 transition"
        >
          Claim
        </a>
      </div>
    </header>
  );
}
