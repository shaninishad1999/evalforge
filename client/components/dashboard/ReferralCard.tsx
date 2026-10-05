import Link from "next/link";

interface ReferralCardProps {
  referralCode: string;
  totalReferrals: number;
  totalEarned: string;
}

export default function ReferralCard({
  referralCode,
  totalReferrals,
  totalEarned,
}: ReferralCardProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-[#1a1d23] to-[#1a1d23] p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
              Referral Program
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Invite & Earn
            </h2>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            ↗
          </div>
        </div>

        <p className="mt-3 text-sm leading-5 text-gray-400">
          Invite people to EvalForge and earn rewards when
          they become eligible.
        </p>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
          <p className="text-xs text-gray-500">
            Your referral code
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-mono text-sm font-semibold text-white">
              {referralCode}
            </span>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined") {
                  navigator.clipboard.writeText(
                    referralCode
                  );
                }
              }}
              className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/15 hover:text-white"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">
              Referrals
            </p>

            <p className="mt-1 text-lg font-semibold text-white">
              {totalReferrals}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Earned
            </p>

            <p className="mt-1 text-lg font-semibold text-white">
              {totalEarned}
            </p>
          </div>
        </div>

        <Link
          href="/referrals"
          className="mt-5 block cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/10"
        >
          Referral Dashboard →
        </Link>
      </div>
    </section>
  );
}