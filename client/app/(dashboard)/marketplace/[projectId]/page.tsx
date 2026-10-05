"use client";

import { useParams, useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

type PaymentType = "TASK" | "HOURLY";

interface Project {
  title: string;
  category: string;
  description: string;
  paymentType: PaymentType;
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
      "Review AI-generated images and assess visual quality, consistency, and adherence to instructions.",

    paymentType: "TASK",
    paymentRate: 30,

    // No reward for this project

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
      "Review AI-generated code for correctness, quality, security, and development best practices.",

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

    // No reward for this project

    status: "Available",

    skills: [
      "Audio Evaluation",
      "English",
      "Quality Assessment",
    ],
  },
};

export default function ProjectDetailsPage() {
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
              onClick={() => router.push("/marketplace")}
              className="mt-5 cursor-pointer rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
            >
              Back to Marketplace
            </button>
          </div>
        </main>
      </div>
    );
  }

  const paymentLabel =
    project.paymentType === "TASK" ? "task" : "hour";

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.replace("/marketplace")}
          className="cursor-pointer text-sm text-gray-500 transition hover:text-white"
        >
          ← Back to Marketplace
        </button>

        {/* Project Header */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#252b42] via-[#202638] to-[#17282d] p-7 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Project Information */}
            <div>
              <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-300">
                {project.category}
              </span>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                {project.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-300">
                {project.description}
              </p>
            </div>

            {/* Payment & Reward */}
            <div className="shrink-0 rounded-2xl border border-white/10 bg-black/10 p-5 lg:min-w-[220px]">
              {/* Payment */}
              <div>
                <p className="text-xs text-gray-500">
                  Payment
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  ₹{project.paymentRate}

                  <span className="ml-1 text-sm font-normal text-gray-400">
                    / {paymentLabel}
                  </span>
                </p>
              </div>

              {/* Reward - only if available */}
              {project.reward !== undefined && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs text-gray-500">
                    Reward
                  </p>

                  <p className="mt-2 text-lg font-semibold text-emerald-400">
                    ₹{project.reward}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Information */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Overview */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">
              Project Overview
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              This project requires contributors to evaluate
              and review AI-generated content according to
              the project guidelines and quality standards.
            </p>

            {/* Required Skills */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-200">
                Required Skills
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
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

          {/* Project Information */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
            {/* Project Status */}
            <p className="text-xs text-gray-500">
              Project Status
            </p>

            <p className="mt-2 text-lg font-semibold text-white">
              {project.status}
            </p>

            {/* Payment Type */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs text-gray-500">
                Payment Type
              </p>

              <p className="mt-2 text-sm text-gray-300">
                {project.paymentType === "TASK"
                  ? "Per Task"
                  : "Hourly"}
              </p>
            </div>

            {/* Payment Rate */}
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-xs text-gray-500">
                Payment Rate
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                ₹{project.paymentRate} / {paymentLabel}
              </p>
            </div>

            {/* Project Reward - only if available */}
            {project.reward !== undefined && (
              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-xs text-gray-500">
                  Project Reward
                </p>

                <p className="mt-2 text-sm font-medium text-emerald-400">
                  ₹{project.reward}
                </p>
              </div>
            )}

            {/* Qualification */}
            <button
              type="button"
              onClick={() =>
                router.replace(
                  `/marketplace/${projectId}/qualification`
                )
              }
              className="mt-6 w-full cursor-pointer rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              View Qualification
            </button>
          </div>
        </section>

        {/* Project Workflow */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
          <h2 className="text-lg font-semibold">
            Project Workflow
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              "Qualification",
              "Dataset",
              "Tasks",
              "Review & Reward",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-xl border border-white/5 bg-[#15181d] p-4"
              >
                <span className="text-xs text-indigo-400">
                  0{index + 1}
                </span>

                <p className="mt-2 text-sm font-medium text-gray-200">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}