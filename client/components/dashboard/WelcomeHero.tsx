interface WelcomeHeroProps {
  name: string;
}

export default function WelcomeHero({
  name,
}: WelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#252b42] via-[#202638] to-[#17282d] px-7 py-9 sm:px-10 sm:py-11">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 right-32 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
            EvalForge Workspace
          </span>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back, {name}
          </h1>

          <p className="mt-4 text-sm leading-6 text-gray-300 sm:text-base">
            Find projects that match your skills, complete
            quality requirements, and grow your earnings on
            EvalForge.
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            className="cursor-pointer rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
          >
            Get More Projects
          </button>

          <p className="mt-2 text-center text-xs text-gray-500">
            Complete courses to unlock more opportunities
          </p>
        </div>
      </div>
    </section>
  );
}