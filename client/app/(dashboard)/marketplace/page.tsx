"use client";

import { useMemo, useState } from "react";

import Navbar from "@/components/layout/Navbar";
import ProjectCard from "@/components/marketplace/ProjectCard";
import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";

interface Project {
  id: string;
  title: string;
  category: string;
  categoryKey: string;
  description: string;

  paymentType: "TASK" | "HOURLY";
  paymentRate: number;
  reward?: number;

  skills: string[];
  status: string;
  statusKey: string;
  match: number;
}

const projects: Project[] = [
  {
    id: "ai-response-evaluation",
    title: "AI Response Evaluation",
    category: "Text Evaluation",
    categoryKey: "text",
    description:
      "Evaluate AI-generated responses for accuracy, relevance, helpfulness, and overall response quality.",

    paymentType: "TASK",
    paymentRate: 25,
    reward: 500,

    skills: [
      "English",
      "AI Evaluation",
      "Critical Thinking",
      "Data Annotation",
    ],

    status: "Qualification",
    statusKey: "qualification",
    match: 96,
  },

  {
    id: "image-quality-assessment",
    title: "Image Quality Assessment",
    category: "Computer Vision",
    categoryKey: "image",
    description:
      "Review AI-generated images and assess visual quality, consistency, and adherence to provided instructions.",

    paymentType: "TASK",
    paymentRate: 30,

    skills: [
      "Image Evaluation",
      "Visual Quality",
      "Attention to Detail",
    ],

    status: "Available",
    statusKey: "available",
    match: 91,
  },

  {
    id: "code-response-review",
    title: "Code Response Review",
    category: "Code Evaluation",
    categoryKey: "code",
    description:
      "Review AI-generated code for correctness, quality, security, and adherence to development best practices.",

    paymentType: "TASK",
    paymentRate: 40,
    reward: 1000,

    skills: [
      "JavaScript",
      "React.js",
      "Code Review",
      "Problem Solving",
    ],

    status: "Available",
    statusKey: "available",
    match: 88,
  },

  {
    id: "audio-response-evaluation",
    title: "Audio Response Evaluation",
    category: "Audio Evaluation",
    categoryKey: "audio",
    description:
      "Evaluate AI-generated audio responses for clarity, naturalness, accuracy, and instruction following.",

    paymentType: "HOURLY",
    paymentRate: 150,

    skills: [
      "Audio Evaluation",
      "English",
      "Quality Assessment",
    ],

    status: "Available",
    statusKey: "available",
    match: 84,
  },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        project.title
          .toLowerCase()
          .includes(searchValue) ||
        project.description
          .toLowerCase()
          .includes(searchValue) ||
        project.skills.some((skill) =>
          skill.toLowerCase().includes(searchValue)
        );

      const matchesCategory =
        category === "all" ||
        project.categoryKey === category;

      const matchesStatus =
        status === "all" ||
        project.statusKey === status;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [search, category, status]);

  const recommendedProjects = filteredProjects.filter(
    (project) => project.match >= 90
  );

  const showRecommended =
    !search &&
    category === "all" &&
    status === "all" &&
    recommendedProjects.length > 0;

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        {/* Marketplace Heading */}
        <section>
          <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
            EvalForge Marketplace
          </span>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Find your next project
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Explore projects matched to your skills and
            discover new AI evaluation opportunities.
          </p>
        </section>

        {/* Filters */}
        <section className="mt-8">
          <MarketplaceFilters
            search={search}
            category={category}
            status={status}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onStatusChange={setStatus}
          />
        </section>

        {/* Recommended */}
        {showRecommended && (
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white">
                Recommended for you
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Projects with the strongest match for
                your profile
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {recommendedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  category={project.category}
                  description={project.description}
                  paymentType={project.paymentType}
                  paymentRate={project.paymentRate}
                  reward={project.reward}
                  skills={project.skills}
                  status={project.status}
                  match={project.match}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Projects */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Available Projects
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredProjects.length} projects available
              </p>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#1a1d23] px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-xl text-gray-500">
                ◇
              </div>

              <h3 className="mt-4 text-base font-medium text-white">
                No projects found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Try changing your search or filters to
                find more projects.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 cursor-pointer rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  category={project.category}
                  description={project.description}
                  paymentType={project.paymentType}
                  paymentRate={project.paymentRate}
                  reward={project.reward}
                  skills={project.skills}
                  status={project.status}
                  match={project.match}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      
    </div>
  );
}