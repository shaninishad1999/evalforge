import Link from "next/link";

interface Project {
  id: string;
  title: string;
  category: string;
  status: string;
  tasks: number;
}

interface ProjectQueueProps {
  projects: Project[];
}

export default function ProjectQueue({
  projects,
}: ProjectQueueProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1a1d23]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Project Queue
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your current project opportunities
          </p>
        </div>

        <Link
          href="/marketplace"
          className="cursor-pointer text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          Marketplace →
        </Link>
      </div>

      <div className="divide-y divide-white/10">
        {projects.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">
              No projects available right now.
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Complete your profile and qualifications to
              unlock more projects.
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/marketplace/${project.id}`}
              className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 transition hover:bg-white/[0.03]"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                  ◇
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-white">
                    {project.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {project.category}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-4 sm:flex">
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-400">
                  {project.status}
                </span>

                <span className="text-xs text-gray-500">
                  {project.tasks} tasks
                </span>
              </div>

              <span className="shrink-0 text-indigo-400">
                →
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}