import { BRAND_NAME } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="border-t border-gold/10 bg-ink/60 mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 text-center text-sm text-muted">
        <p>
          © {new Date().getFullYear()} {BRAND_NAME}. Rewards are subject to
          game terms.
        </p>
        <p className="mt-2 text-xs opacity-70">
          Enter your in-game user ID to look up and claim available coins.
        </p>
      </div>
    </footer>
  );
}
