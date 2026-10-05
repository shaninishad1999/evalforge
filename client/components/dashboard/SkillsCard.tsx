import Link from "next/link";

interface Skill {
  name: string;
  level: string;
  verified: boolean;
}

interface SkillsCardProps {
  skills: Skill[];
}

export default function SkillsCard({
  skills,
}: SkillsCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Your Skills
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Skills used for project matching
          </p>
        </div>

        <Link
          href="/profile"
          className="cursor-pointer text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          Manage →
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-[#15181d] px-4 py-3"
          >
            <span className="text-sm text-gray-300">
              {skill.name}
            </span>

            {skill.verified ? (
              <span className="text-xs text-emerald-400">
                ✓ Verified
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                Pending
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}