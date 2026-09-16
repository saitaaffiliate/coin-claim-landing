import ClaimForm from "@/components/ClaimForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import { BRAND_NAME, SITE_TAGLINE } from "@/lib/config";

export default function Home() {
  return (
    <div id="top" className="hero-glow relative min-h-screen min-w-0 flex flex-col overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0 grid-fade opacity-60"
        aria-hidden
      />
      <Header />

      <main className="relative z-10 flex-1 w-full min-w-0">
        <section
          id="claim"
          className="mx-auto w-full max-w-5xl px-3 pt-8 pb-10 sm:px-6 sm:pt-14 sm:pb-16"
        >
          <div className="text-center mb-6 sm:mb-8 px-1">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gold-bright">
              <span aria-hidden>◆</span>
              <span className="truncate">In-game rewards</span>
            </p>
            <h1 className="mt-4 sm:mt-5 text-[1.75rem] leading-tight sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground break-words">
              Claim your{" "}
              <span className="bg-gradient-to-r from-gold-bright via-gold to-gold-bright bg-clip-text text-transparent">
                coins
              </span>
            </h1>
            <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-muted leading-relaxed px-1">
              {SITE_TAGLINE}. Enter your account below to look up and claim —
              built for {BRAND_NAME}.
            </p>
          </div>
          <ClaimForm />
        </section>

        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
}
