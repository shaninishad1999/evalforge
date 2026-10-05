"use client";

import { useMemo, useState } from "react";


type ReviewStatus = "Excellent" | "Good" | "Needs Improvement";

interface ProjectReview {
  id: string;
  project: string;
  reviews: number;
  rating: number;
  approvalRate: number;
  status: ReviewStatus;
}

interface RecentReview {
  id: string;
  project: string;
  task: string;
  rating: number;
  feedback: string;
  date: string;
}

const projectReviews: ProjectReview[] = [
  {
    id: "1",
    project: "AI Response Evaluation",
    reviews: 52,
    rating: 4.8,
    approvalRate: 96,
    status: "Excellent",
  },
  {
    id: "2",
    project: "Image Quality Assessment",
    reviews: 38,
    rating: 4.5,
    approvalRate: 92,
    status: "Excellent",
  },
  {
    id: "3",
    project: "Code Response Review",
    reviews: 24,
    rating: 4.4,
    approvalRate: 88,
    status: "Good",
  },
  {
    id: "4",
    project: "Audio Response Evaluation",
    reviews: 14,
    rating: 4.7,
    approvalRate: 94,
    status: "Excellent",
  },
];

const recentReviews: RecentReview[] = [
  {
    id: "1",
    project: "AI Response Evaluation",
    task: "Task #1024",
    rating: 5,
    feedback:
      "Accurate and consistent evaluation with strong attention to detail.",
    date: "Oct 04, 2026",
  },
  {
    id: "2",
    project: "Image Quality Assessment",
    task: "Task #981",
    rating: 4.5,
    feedback:
      "Good visual assessment. A few minor details could be improved.",
    date: "Oct 03, 2026",
  },
  {
    id: "3",
    project: "Code Response Review",
    task: "Task #876",
    rating: 4,
    feedback:
      "Good code review. Security considerations were correctly identified.",
    date: "Oct 02, 2026",
  },
  {
    id: "4",
    project: "AI Response Evaluation",
    task: "Task #841",
    rating: 5,
    feedback:
      "Excellent understanding of the evaluation guidelines.",
    date: "Sep 30, 2026",
  },
  {
    id: "5",
    project: "Audio Response Evaluation",
    task: "Task #744",
    rating: 4.5,
    feedback:
      "Strong evaluation with consistent quality across the task.",
    date: "Sep 28, 2026",
  },
];

const ratingDistribution = [
  {
    rating: 5,
    count: 92,
    percentage: 72,
  },
  {
    rating: 4,
    count: 28,
    percentage: 22,
  },
  {
    rating: 3,
    count: 6,
    percentage: 5,
  },
  {
    rating: 2,
    count: 2,
    percentage: 1,
  },
  {
    rating: 1,
    count: 0,
    percentage: 0,
  },
];

const qualityTrend = [
  {
    month: "Jul",
    rating: 4.3,
  },
  {
    month: "Aug",
    rating: 4.5,
  },
  {
    month: "Sep",
    rating: 4.7,
  },
  {
    month: "Oct",
    rating: 4.6,
  },
];

function RatingStars({
  rating,
  size = "text-sm",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= Math.round(rating)
              ? "text-amber-400"
              : "text-gray-700"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function QualityPage() {
  const [period, setPeriod] = useState("120");

  const averageRating = useMemo(() => {
    const totalReviews = projectReviews.reduce(
      (sum, project) => sum + project.reviews,
      0
    );

    const weightedRating = projectReviews.reduce(
      (sum, project) =>
        sum + project.rating * project.reviews,
      0
    );

    return totalReviews
      ? weightedRating / totalReviews
      : 0;
  }, []);

  const totalReviews = projectReviews.reduce(
    (sum, project) => sum + project.reviews,
    0
  );

  const averageApprovalRate = Math.round(
    projectReviews.reduce(
      (sum, project) =>
        sum + project.approvalRate * project.reviews,
      0
    ) / totalReviews
  );

  const maxTrendRating = 5;

  return (
    <div className="min-h-screen bg-[#111318] text-white">

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        {/* Header */}
        <section>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
                EvalForge Quality
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Quality
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
                Review your project performance, reviewer
                ratings, and quality history.
              </p>
            </div>

            <div>
              <label
                htmlFor="quality-period"
                className="mb-2 block text-xs font-medium text-gray-500"
              >
                Review Period
              </label>

              <select
                id="quality-period"
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value)
                }
                className="cursor-pointer rounded-xl border border-white/10 bg-[#1a1d23] px-4 py-3 text-sm text-gray-300 outline-none transition focus:border-indigo-400/40"
              >
                <option value="30">Last 30 Days</option>
                <option value="60">Last 60 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="120">
                  Last 120 Days
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* Overall Quality */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Main Rating */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-7 lg:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
              Overall Quality Score
            </p>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-5xl font-semibold tracking-tight text-white">
                {averageRating.toFixed(1)}
              </span>

              <span className="pb-1 text-sm text-gray-500">
                / 5
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <RatingStars
                rating={averageRating}
                size="text-xl"
              />

              <span className="text-sm text-gray-400">
                Excellent
              </span>
            </div>

            <p className="mt-5 text-sm leading-6 text-gray-500">
              Your overall rating is based on reviewer
              feedback from the last {period} days.
            </p>

            <div className="mt-6 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Quality level
                </span>

                <span className="text-sm font-medium text-emerald-400">
                  Excellent
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${(averageRating / 5) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
              <p className="text-xs font-medium text-gray-500">
                Reviews Received
              </p>

              <p className="mt-3 text-3xl font-semibold text-white">
                {totalReviews}
              </p>

              <p className="mt-3 text-xs text-gray-600">
                Reviewer assessments
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
              <p className="text-xs font-medium text-gray-500">
                Approval Rate
              </p>

              <p className="mt-3 text-3xl font-semibold text-white">
                {averageApprovalRate}%
              </p>

              <p className="mt-3 text-xs text-emerald-400">
                Tasks approved without major issues
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
              <p className="text-xs font-medium text-gray-500">
                5★ Reviews
              </p>

              <p className="mt-3 text-3xl font-semibold text-white">
                92
              </p>

              <p className="mt-3 text-xs text-gray-600">
                Excellent reviewer ratings
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
              <p className="text-xs font-medium text-gray-500">
                Revision Requests
              </p>

              <p className="mt-3 text-3xl font-semibold text-white">
                12
              </p>

              <p className="mt-3 text-xs text-gray-600">
                Tasks requiring improvements
              </p>
            </div>
          </div>
        </section>

        {/* Rating Distribution */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d23] p-6 sm:p-7">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Rating Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              How reviewers have rated your work
            </p>
          </div>

          <div className="mt-7 max-w-4xl space-y-4">
            {ratingDistribution.map((item) => (
              <div
                key={item.rating}
                className="flex items-center gap-4"
              >
                <div className="flex w-14 shrink-0 items-center gap-1.5">
                  <span className="text-sm text-gray-300">
                    {item.rating}
                  </span>

                  <span className="text-xs text-amber-400">
                    ★
                  </span>
                </div>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>

                <span className="w-10 text-right text-xs text-gray-500">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Quality Trend */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d23] p-6 sm:p-7">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Quality Trend
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your average rating over the past 120 days
            </p>
          </div>

          <div className="mt-8">
            <div className="flex h-[280px] items-end gap-4 border-b border-white/10 px-2 sm:gap-8">
              {qualityTrend.map((item) => {
                const height =
                  (item.rating / maxTrendRating) * 100;

                return (
                  <div
                    key={item.month}
                    className="group flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <div className="relative flex h-full w-full items-end justify-center">
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {[5, 4, 3, 2, 1].map(
                          (value) => (
                            <div
                              key={value}
                              className="border-t border-dashed border-white/5"
                            />
                          )
                        )}
                      </div>

                      <div
                        className="relative z-10 w-full max-w-[90px] rounded-t-xl bg-indigo-500/70 transition hover:bg-indigo-400"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${item.rating.toFixed(
                          1
                        )} / 5`}
                      >
                        <span className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#111318] px-2 py-1 text-[10px] text-gray-300 group-hover:block">
                          {item.rating.toFixed(1)} / 5
                        </span>
                      </div>
                    </div>

                    <span className="mt-3 text-xs text-gray-600">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Project Performance */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d23] p-6 sm:p-7">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Project Performance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Quality performance across your projects
            </p>
          </div>

          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Project
                  </th>

                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Reviews
                  </th>

                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Rating
                  </th>

                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Approval
                  </th>

                  <th className="pb-4 text-right text-xs font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {projectReviews.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-5 text-sm font-medium text-gray-300">
                      {project.project}
                    </td>

                    <td className="py-5 text-sm text-gray-500">
                      {project.reviews}
                    </td>

                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <RatingStars
                          rating={project.rating}
                        />

                        <span className="text-sm font-medium text-white">
                          {project.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    <td className="py-5 text-sm text-gray-400">
                      {project.approvalRate}%
                    </td>

                    <td className="py-5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          project.status === "Excellent"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : project.status === "Good"
                              ? "bg-indigo-500/10 text-indigo-300"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="mt-6 space-y-3 md:hidden">
            {projectReviews.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-white/5 bg-[#15181d] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {project.project}
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      {project.reviews} reviews
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      project.status === "Excellent"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-indigo-500/10 text-indigo-300"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RatingStars
                      rating={project.rating}
                    />

                    <span className="text-sm text-white">
                      {project.rating.toFixed(1)} / 5
                    </span>
                  </div>

                  <span className="text-xs text-gray-500">
                    {project.approvalRate}% approval
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Reviews */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d23] p-6 sm:p-7">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Recent Reviews
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest feedback from project reviewers
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-white/5 bg-[#15181d] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-sm font-medium text-gray-200">
                        {review.project}
                      </h3>

                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-gray-500">
                        {review.task}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <RatingStars rating={review.rating} />

                      <span className="text-sm font-medium text-white">
                        {review.rating.toFixed(1)} / 5
                      </span>
                    </div>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
                      {review.feedback}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-gray-600">
                    {review.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quality Areas */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d23] p-6 sm:p-7">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Quality Areas
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The main areas considered during project
              reviews
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Accuracy",
                score: 4.8,
                description:
                  "Correctness and reliability of your evaluations.",
              },
              {
                title: "Relevance",
                score: 4.7,
                description:
                  "How well your responses address the task.",
              },
              {
                title: "Instruction Following",
                score: 4.6,
                description:
                  "Following project guidelines and requirements.",
              },
              {
                title: "Attention to Detail",
                score: 4.5,
                description:
                  "Identifying important details and inconsistencies.",
              },
            ].map((area) => (
              <div
                key={area.title}
                className="rounded-xl border border-white/5 bg-[#15181d] p-5"
              >
                <h3 className="text-sm font-medium text-gray-200">
                  {area.title}
                </h3>

                <div className="mt-4 flex items-center justify-between">
                  <RatingStars rating={area.score} />

                  <span className="text-sm font-semibold text-white">
                    {area.score.toFixed(1)}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-gray-600">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}