import ClaimForm from "@/components/ClaimForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import { BRAND_NAME, SITE_TAGLINE } from "@/lib/config";

export default function Home() {
  return (
    <>
      <div id="top" className="hero-glow relative min-h-screen flex flex-col">
        <div
          className="pointer-events-none absolute inset-0 grid-fade opacity-60"
          aria-hidden
        />
        <Header />

        <main className="relative z-10 flex-1">
          {/* Hero */}
          <section className="mx-auto max-w-5xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20 sm:pb-14 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold-bright">
              <span aria-hidden>◆</span> In-game rewards
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Claim your{" "}
              <span className="bg-gradient-to-r from-gold-bright via-gold to-gold-bright bg-clip-text text-transparent">
                coins
              </span>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-muted leading-relaxed">
              {SITE_TAGLINE}. Look up your account, review what you’ve earned,
              and claim in one tap — built for {BRAND_NAME}.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#claim"
                className="rounded-xl bg-gradient-to-b from-gold-bright to-gold px-6 py-3 font-semibold text-ink shadow-glow hover:brightness-110 transition"
              >
                Start claiming
              </a>
              <a
                href="#how"
                className="rounded-xl border border-gold/25 px-6 py-3 font-medium text-gold-bright hover:bg-gold/10 transition"
              >
                How it works
              </a>
            </div>
          </section>

          <HowItWorks />

          {/* Claim */}
          <section
            id="claim"
            className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Ready when you are
              </h2>
              <p className="mt-2 text-sm text-muted">
                Stub demo: try{" "}
                <code className="text-gold-bright/90">player1</code>,{" "}
                <code className="text-gold-bright/90">player2</code>,{" "}
                <code className="text-gold-bright/90">demo</code>, or{" "}
                <code className="text-gold-bright/90">vip_user</code>
              </p>
            </div>
            <ClaimForm />
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
