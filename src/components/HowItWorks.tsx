const steps = [
  {
    step: "1",
    title: "Enter your ID",
    body: "Type the user ID or username linked to your game account.",
  },
  {
    step: "2",
    title: "Check balance",
    body: "We’ll show any coins waiting for you — no login spam required.",
  },
  {
    step: "3",
    title: "Claim rewards",
    body: "Hit Claim to lock them in. One claim per reward cycle.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="relative z-10 mx-auto w-full max-w-5xl px-3 py-12 sm:px-6 sm:py-20"
    >
      <h2 className="text-center text-xl sm:text-3xl font-semibold text-foreground tracking-tight px-2">
        How it works
      </h2>
      <p className="mt-2 text-center text-muted text-sm sm:text-base max-w-lg mx-auto px-2">
        Three quick steps from lookup to claimed coins.
      </p>
      <ol className="mt-8 sm:mt-10 grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.step}
            className="rounded-2xl border border-gold/15 bg-surface/50 p-4 sm:p-6 min-w-0"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-sm font-bold text-gold-bright border border-gold/30">
              {s.step}
            </span>
            <h3 className="mt-3 text-base sm:text-lg font-semibold text-foreground">
              {s.title}
            </h3>
            <p className="mt-1.5 text-sm text-muted leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
