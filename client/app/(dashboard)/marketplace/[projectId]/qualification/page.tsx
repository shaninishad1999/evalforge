"use client";

import { useParams, useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

interface Project {
  title: string;
  category: string;
  description: string;
  paymentType: "TASK" | "HOURLY";
  paymentRate: number;
  reward?: number;
  status: string;
  skills: string[];
}

const projectData: Record<string, Project> = {
  "ai-response-evaluation": {
    title: "AI Response Evaluation",
    category: "Text Evaluation",
    description:
      "Evaluate AI-generated responses for accuracy, relevance, helpfulness, and overall response quality.",

    paymentType: "TASK",
    paymentRate: 25,
    reward: 500,

    status: "Qualification Required",

    skills: [
      "English",
      "AI Evaluation",
      "Critical Thinking",
      "Data Annotation",
    ],
  },

  "image-quality-assessment": {
    title: "Image Quality Assessment",
    category: "Computer Vision",
    description:
      "Review AI-generated images and assess visual quality, consistency, and adherence to provided instructions.",

    paymentType: "TASK",
    paymentRate: 30,

    status: "Available",

    skills: [
      "Image Evaluation",
      "Visual Quality",
      "Attention to Detail",
    ],
  },

  "code-response-review": {
    title: "Code Response Review",
    category: "Code Evaluation",
    description:
      "Review AI-generated code for correctness, quality, security, and adherence to development best practices.",

    paymentType: "TASK",
    paymentRate: 40,
    reward: 1000,

    status: "Available",

    skills: [
      "JavaScript",
      "React.js",
      "Code Review",
      "Problem Solving",
    ],
  },

  "audio-response-evaluation": {
    title: "Audio Response Evaluation",
    category: "Audio Evaluation",
    description:
      "Evaluate AI-generated audio responses for clarity, naturalness, accuracy, and instruction following.",

    paymentType: "HOURLY",
    paymentRate: 150,

    status: "Available",

    skills: [
      "Audio Evaluation",
      "English",
      "Quality Assessment",
    ],
  },
};

export default function QualificationPage() {
  const router = useRouter();
  const params = useParams();

  const projectId = String(params.projectId);

  const project = projectData[projectId];

  if (!project) {
    return (
      <div className="min-h-screen bg-[#111318] text-white">
        <Navbar />

        <main className="mx-auto flex min-h-[70vh] max-w-[1440px] items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              Project not found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              The project you are looking for does not exist.
            </p>

<button
  type="button"
  onClick={() =>
    router.replace(`/marketplace/${projectId}`)
  }
  className="cursor-pointer text-sm text-gray-500 transition hover:text-white"
>
  ← Back to Project
</button>
          </div>
        </main>
      </div>
    );
  }

  const paymentUnit =
    project.paymentType === "TASK" ? "task" : "hour";

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        {/* Back */}
        <button
          type="button"
          onClick={() =>
            router.push(`/marketplace/${projectId}`)
          }
          className="cursor-pointer text-sm text-gray-500 transition hover:text-white"
        >
          ← Back to Project
        </button>

        {/* Header */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#252b42] via-[#202638] to-[#17282d] p-7 sm:p-10">
          <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
            Qualification
          </span>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-300">
            Before accessing tasks for this project, you
            need to complete the qualification process.
            Your qualification helps us verify that you
            understand the project guidelines and quality
            requirements.
          </p>

          {/* Project Summary */}
          <div className="mt-7 flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <p className="text-[11px] text-gray-500">
                Category
              </p>

              <p className="mt-1 text-sm font-medium text-gray-200">
                {project.category}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <p className="text-[11px] text-gray-500">
                Payment
              </p>

              <p className="mt-1 text-sm font-medium text-gray-200">
                ₹{project.paymentRate} / {paymentUnit}
              </p>
            </div>

            {project.reward !== undefined && (
              <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                <p className="text-[11px] text-gray-500">
                  Reward
                </p>

                <p className="mt-1 text-sm font-medium text-emerald-400">
                  ₹{project.reward}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <p className="text-[11px] text-gray-500">
                Status
              </p>

              <p className="mt-1 text-sm font-medium text-indigo-300">
                {project.status}
              </p>
            </div>
          </div>
        </section>

        {/* Qualification Information */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Instructions */}
            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
              <h2 className="text-lg font-semibold text-white">
                Qualification Instructions
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Read the project requirements carefully
                before starting the qualification.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Read all project guidelines carefully.",
                  "Understand the evaluation criteria before answering.",
                  "Pay attention to accuracy, relevance, and quality.",
                  "Complete the qualification independently.",
                  "Maintain the required quality standards throughout the project.",
                ].map((instruction, index) => (
                  <div
                    key={instruction}
                    className="flex gap-3 rounded-xl border border-white/5 bg-[#15181d] p-4"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-medium text-indigo-300">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-6 text-gray-400">
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Areas */}
            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
              <h2 className="text-lg font-semibold text-white">
                What will be evaluated?
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Accuracy",
                    description:
                      "Your ability to identify correct and incorrect information.",
                  },
                  {
                    title: "Relevance",
                    description:
                      "Your ability to determine whether a response addresses the given task.",
                  },
                  {
                    title: "Quality",
                    description:
                      "Your understanding of the required quality standards.",
                  },
                  {
                    title: "Attention to Detail",
                    description:
                      "Your ability to identify important details and inconsistencies.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/5 bg-[#15181d] p-4"
                  >
                    <h3 className="text-sm font-medium text-gray-200">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
              <h2 className="text-lg font-semibold text-white">
                Required Skills
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="h-fit rounded-2xl border border-white/10 bg-[#1a1d23] p-6 lg:sticky lg:top-24">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
              Ready?
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Start Qualification
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Complete the qualification to unlock the
              next stage of this project.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-xs text-indigo-300">
                  1
                </div>

                <span className="text-sm text-gray-300">
                  Read guidelines
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-xs text-indigo-300">
                  2
                </div>

                <span className="text-sm text-gray-300">
                  Complete qualification
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-xs text-indigo-300">
                  3
                </div>

                <span className="text-sm text-gray-300">
                  Unlock project tasks
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                // Qualification API will be connected here.
              }}
              className="mt-7 w-full cursor-pointer rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Start Qualification
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-gray-600">
              Make sure you understand the project
              guidelines before starting.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}