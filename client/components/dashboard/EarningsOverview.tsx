import Link from "next/link";

interface MonthlyEarning {
  month: string;
  amount: string;
}

interface EarningsOverviewProps {
  total: string;
  available: string;
  pending: string;
  monthly: MonthlyEarning[];
}

export default function EarningsOverview({
  total,
  available,
  pending,
  monthly,
}: EarningsOverviewProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">
            Total Earnings
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {total}
          </h2>
        </div>

        <Link
          href="/earnings"
          className="cursor-pointer text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          View details →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#15181d] p-4">
          <p className="text-xs text-gray-500">
            Available
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {available}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#15181d] p-4">
          <p className="text-xs text-gray-500">
            Pending
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {pending}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">
            Monthly Earnings
          </h3>

          <span className="text-xs text-gray-500">
            Last 6 months
          </span>
        </div>

        <div className="space-y-3">
          {monthly.map((item) => (
            <div
              key={item.month}
              className="flex items-center justify-between"
            >
              <span className="text-xs text-gray-500">
                {item.month}
              </span>

              <span className="text-sm font-medium text-gray-200">
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}