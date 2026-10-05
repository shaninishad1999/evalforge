import Link from "next/link";

interface ProjectCardProps {
  id: string;
  title: string;
  category: string;
  description: string;

  paymentType: "TASK" | "HOURLY";
  paymentRate: number;

  reward?: number;

  skills: string[];
  status: string;
  match?: number;
}

export default function ProjectCard({
  id,
  title,
  category,
  description,
  paymentType,
  paymentRate,
  reward,
  skills,
  status,
  match,
}: ProjectCardProps) {
  const paymentUnit =
    paymentType === "TASK" ? "task" : "hour";

  return (
    <Link
      href={`/marketplace/${id}`}
      className="group block cursor-pointer rounded-2xl border border-white/10 bg-[#1a1d23] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400/30 hover:bg-[#1d2027]"
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-lg text-indigo-300">
            ◇
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-white transition group-hover:text-indigo-300">
              {title}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {category}
            </p>
          </div>
        </div>

        {/* Match */}
        {match !== undefined && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-emerald-400">
              {match}%
            </p>

            <p className="text-[11px] text-gray-600">
              Match
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="mt-5 line-clamp-2 text-sm leading-6 text-gray-400">
        {description}
      </p>

      {/* Skills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {skills.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-gray-400"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Bottom */}
      <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          {/* Payment */}
          <div>
            <p className="text-[11px] text-gray-600">
              Payment
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              ₹{paymentRate}

              <span className="ml-1 text-xs font-normal text-gray-500">
                / {paymentUnit}
              </span>
            </p>
          </div>

          {/* Optional Reward */}
          {reward !== undefined && (
            <div>
              <p className="text-[11px] text-gray-600">
                Reward
              </p>

              <p className="mt-1 text-sm font-semibold text-emerald-400">
                ₹{reward}
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <span className="w-fit shrink-0 rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
          {status}
        </span>
      </div>

      {/* View Project */}
      <div className="mt-4 flex items-center justify-end">
        <span className="text-xs font-medium text-indigo-400 transition group-hover:text-indigo-300">
          View Project →
        </span>
      </div>
    </Link>
  );
}