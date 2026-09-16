import { BRAND_NAME } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="border-t border-gold/10 bg-ink/60 mt-auto w-full min-w-0">
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8 text-center text-xs sm:text-sm text-muted">
        <p className="break-words px-1">
          © {new Date().getFullYear()} {BRAND_NAME}. Rewards are subject to
          game terms.
        </p>
        <p className="mt-2 text-[11px] sm:text-xs opacity-70 px-1 leading-relaxed">
          Enter your in-game user ID to look up and claim available Robux.
        </p>
      </div>
    </footer>
  );
}
