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
          {/* Coin generator / claim — top of page */}
          <section
            id="claim"
            className="mx-auto max-w-5xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16"
          >
            <div className="text-center mb-8">
              <p className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold-bright">
                <span aria-hidden>◆</span> In-game rewards
              </p>
              <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Claim your{" "}
                <span className="bg-gradient-to-r from-gold-bright via-gold to-gold-bright bg-clip-text text-transparent">
                  coins
                </span>
              </h1>
              <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-muted leading-relaxed">
                {SITE_TAGLINE}. Enter your account below to look up and claim —
                built for {BRAND_NAME}.
              </p>
              <p className="mt-3 text-xs text-muted/80">
                Stub demo: try{" "}
                <code className="text-gold-bright/90">player1</code>,{" "}
                <code className="text-gold-bright/90">player2</code>,{" "}
                <code className="text-gold-bright/90">demo</code>, or{" "}
                <code className="text-gold-bright/90">vip_user</code>
              </p>
            </div>
            <ClaimForm />
          </section>

          <HowItWorks />
        </main>

        <Footer />
      </div>
    </>
  );
}
