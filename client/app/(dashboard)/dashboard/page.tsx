"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";

import WelcomeHero from "@/components/dashboard/WelcomeHero";
import ProjectQueue from "@/components/dashboard/ProjectQueue";
import EarningsOverview from "@/components/dashboard/EarningsOverview";
import ReferralCard from "@/components/dashboard/ReferralCard";
import SkillsCard from "@/components/dashboard/SkillsCard";

export default function DashboardPage() {
  const router = useRouter();

  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111318]">
        <div className="text-sm text-gray-400">
          Loading EvalForge...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        {/* -------------------------------------------------- */}
        {/* Welcome */}
        {/* -------------------------------------------------- */}

        <WelcomeHero
          name={user.name.split(" ")[0]}
        />

        {/* -------------------------------------------------- */}
        {/* Project Queue */}
        {/* -------------------------------------------------- */}

        <section className="mt-8">
          <ProjectQueue
            projects={[
              {
                id: "project-1",
                title: "AI Response Evaluation",
                category: "Text Evaluation",
                status: "Qualification",
                tasks: 120,
              },
              {
                id: "project-2",
                title: "Image Quality Assessment",
                category: "Computer Vision",
                status: "Available",
                tasks: 85,
              },
              {
                id: "project-3",
                title: "Code Response Review",
                category: "Code Evaluation",
                status: "Available",
                tasks: 60,
              },
            ]}
          />
        </section>

        {/* -------------------------------------------------- */}
        {/* Earnings + Referral */}
        {/* -------------------------------------------------- */}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <EarningsOverview
            total="₹12,450"
            available="₹10,000"
            pending="₹2,450"
            monthly={[
              {
                month: "October",
                amount: "₹4,250",
              },
              {
                month: "September",
                amount: "₹3,800",
              },
              {
                month: "August",
                amount: "₹2,100",
              },
              {
                month: "July",
                amount: "₹1,500",
              },
              {
                month: "June",
                amount: "₹800",
              },
            ]}
          />

          <ReferralCard
            referralCode="EVAL-SHANI"
            totalReferrals={4}
            totalEarned="₹800"
          />
        </section>

        {/* -------------------------------------------------- */}
        {/* Skills */}
        {/* -------------------------------------------------- */}

        <section className="mt-8">
          <SkillsCard
            skills={[
              {
                name: "JavaScript",
                level: "Advanced",
                verified: true,
              },
              {
                name: "React.js",
                level: "Advanced",
                verified: true,
              },
              {
                name: "AI Evaluation",
                level: "Intermediate",
                verified: true,
              },
              {
                name: "Data Annotation",
                level: "Intermediate",
                verified: true,
              },
            ]}
          />
        </section>
      </main>

    
    </div>
  );
}