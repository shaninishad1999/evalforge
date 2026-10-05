"use client";

import { useMemo, useState } from "react";


type DateRange =
  | "7"
  | "30"
  | "90"
  | "180"
  | "365";

interface Earning {
  id: string;
  project: string;
  task: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending";
  type: "Task" | "Reward" | "Bonus";
}

const earnings: Earning[] = [
  {
    id: "1",
    project: "AI Response Evaluation",
    task: "Task #1024",
    date: "Oct 04, 2026",
    amount: 250,
    status: "Paid",
    type: "Task",
  },
  {
    id: "2",
    project: "Image Quality Assessment",
    task: "Task #981",
    date: "Oct 03, 2026",
    amount: 300,
    status: "Paid",
    type: "Task",
  },
  {
    id: "3",
    project: "Code Response Review",
    task: "Task #876",
    date: "Oct 02, 2026",
    amount: 400,
    status: "Pending",
    type: "Task",
  },
  {
    id: "4",
    project: "AI Response Evaluation",
    task: "Project Reward",
    date: "Sep 30, 2026",
    amount: 500,
    status: "Paid",
    type: "Reward",
  },
  {
    id: "5",
    project: "Audio Response Evaluation",
    task: "Task #744",
    date: "Sep 28, 2026",
    amount: 450,
    status: "Paid",
    type: "Task",
  },
];

const monthlyEarnings = [
  { month: "May", amount: 3200 },
  { month: "Jun", amount: 4800 },
  { month: "Jul", amount: 5600 },
  { month: "Aug", amount: 7200 },
  { month: "Sep", amount: 8900 },
  { month: "Oct", amount: 8450 },
];

export default function EarningsPage() {
  const [dateRange, setDateRange] =
    useState<DateRange>("30");

  const totalEarnings = 24850;
  const thisMonth = 8450;
  const availableBalance = 18200;
  const pendingEarnings = 6650;

  const taskEarnings = 15500;
  const projectRewards = 7000;
  const bonuses = 2350;

  const maxChartValue = useMemo(() => {
    return Math.max(
      ...monthlyEarnings.map((item) => item.amount)
    );
  }, []);

  const dateRangeLabel: Record<DateRange, string> = {
    "7": "Last 7 Days",
    "30": "Last 30 Days",
    "90": "Last 90 Days",
    "180": "Last 6 Months",
    "365": "Last 12 Months",
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white">

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        {/* Header */}
        <section>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
                EvalForge Earnings
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Earnings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
                Track your earnings, payment history, and
                available withdrawal balance.
              </p>
            </div>

            {/* Date Range */}
            <div>
              <label
                htmlFor="date-range"
                className="mb-2 block text-xs font-medium text-gray-500"
              >
                Date Range
              </label>

              <select
                id="date-range"
                value={dateRange}
                onChange={(event) =>
                  setDateRange(
                    event.target.value as DateRange
                  )
                }
                className="cursor-pointer rounded-xl border border-white/10 bg-[#1a1d23] px-4 py-3 text-sm text-gray-300 outline-none transition focus:border-indigo-400/40"
              >
                {Object.entries(dateRangeLabel).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Earnings */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Total Earnings
                </p>

                <p className="mt-3 text-2xl font-semibold text-white">
                  ₹{totalEarnings.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                ₹
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Lifetime earnings
            </p>
          </div>

          {/* This Month */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  This Month
                </p>

                <p className="mt-3 text-2xl font-semibold text-white">
                  ₹{thisMonth.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                ↗
              </div>
            </div>

            <p className="mt-4 text-xs text-emerald-400">
              +12.5% from last month
            </p>
          </div>

          {/* Available Balance */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Available Balance
                </p>

                <p className="mt-3 text-2xl font-semibold text-white">
                  ₹{availableBalance.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                ◈
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Available for withdrawal
            </p>
          </div>

          {/* Pending */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Pending Earnings
                </p>

                <p className="mt-3 text-2xl font-semibold text-white">
                  ₹{pendingEarnings.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                ◷
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Awaiting approval
            </p>
          </div>
        </section>

        {/* Earnings Chart */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d23] p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Earnings Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Earnings performance over the last 6 months
              </p>
            </div>

            <p className="text-sm font-medium text-indigo-300">
              ₹{thisMonth.toLocaleString("en-IN")} this month
            </p>
          </div>

          {/* Chart */}
          <div className="mt-8">
            <div className="flex h-[280px] items-end gap-3 border-b border-white/10 px-2 sm:gap-6">
              {monthlyEarnings.map((item) => {
                const height =
                  (item.amount / maxChartValue) * 100;

                return (
                  <div
                    key={item.month}
                    className="group flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <div className="relative flex w-full flex-1 items-end justify-center">
                      <div className="absolute bottom-0 h-full w-full border-l border-dashed border-white/5" />

                      <div
                        className="relative z-10 w-full max-w-[70px] rounded-t-xl bg-indigo-500/70 transition hover:bg-indigo-400"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`₹${item.amount.toLocaleString(
                          "en-IN"
                        )}`}
                      >
                        <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#111318] px-2 py-1 text-[10px] text-gray-300 group-hover:block">
                          ₹
                          {item.amount.toLocaleString(
                            "en-IN"
                          )}
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

        {/* Breakdown + Wallet */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Earnings Breakdown */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6 lg:col-span-2">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Earnings Breakdown
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Where your earnings are coming from
              </p>
            </div>

            <div className="mt-7 space-y-6">
              {/* Task Earnings */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Task Earnings
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Payments from completed tasks
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-white">
                    ₹{taskEarnings.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: "62%",
                    }}
                  />
                </div>
              </div>

              {/* Project Rewards */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Project Rewards
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Project completion rewards
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-white">
                    ₹{projectRewards.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: "28%",
                    }}
                  />
                </div>
              </div>

              {/* Bonuses */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Bonuses
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Performance and special bonuses
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-white">
                    ₹{bonuses.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: "10%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <aside className="rounded-2xl border border-white/10 bg-[#1a1d23] p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
              Wallet
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Available Balance
            </h2>

            <p className="mt-4 text-3xl font-semibold text-white">
              ₹{availableBalance.toLocaleString("en-IN")}
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              This amount is currently available for
              withdrawal.
            </p>

            <div className="mt-6 rounded-xl border border-white/5 bg-[#15181d] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Pending
                </span>

                <span className="text-sm font-medium text-amber-400">
                  ₹
                  {pendingEarnings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 w-full cursor-pointer rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Withdraw Funds
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-gray-600">
              Withdrawal options will be available based
              on your account eligibility.
            </p>
          </aside>
        </section>

        {/* Recent Earnings */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d23] p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Earnings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest earning activity
              </p>
            </div>

            <span className="text-xs text-gray-600">
              {dateRangeLabel[dateRange]}
            </span>
          </div>

          {/* Desktop Table */}
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Project
                  </th>

                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Task
                  </th>

                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Date
                  </th>

                  <th className="pb-4 text-xs font-medium text-gray-600">
                    Type
                  </th>

                  <th className="pb-4 text-right text-xs font-medium text-gray-600">
                    Amount
                  </th>

                  <th className="pb-4 text-right text-xs font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {earnings.map((earning) => (
                  <tr
                    key={earning.id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-5 text-sm font-medium text-gray-300">
                      {earning.project}
                    </td>

                    <td className="py-5 text-sm text-gray-500">
                      {earning.task}
                    </td>

                    <td className="py-5 text-sm text-gray-500">
                      {earning.date}
                    </td>

                    <td className="py-5">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-gray-400">
                        {earning.type}
                      </span>
                    </td>

                    <td className="py-5 text-right text-sm font-semibold text-white">
                      ₹{earning.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="py-5 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          earning.status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {earning.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mt-6 space-y-3 md:hidden">
            {earnings.map((earning) => (
              <div
                key={earning.id}
                className="rounded-xl border border-white/5 bg-[#15181d] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-200">
                      {earning.project}
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      {earning.task}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-white">
                    ₹{earning.amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-600">
                      {earning.date}
                    </p>

                    <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-gray-400">
                      {earning.type}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      earning.status === "Paid"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {earning.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}