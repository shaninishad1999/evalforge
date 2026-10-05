"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EF";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111318]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex cursor-pointer items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white">
            EF
          </div>

          <span className="text-xl font-semibold tracking-tight text-white">
            EvalForge
          </span>
        </button>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer text-sm font-medium text-white transition hover:text-indigo-300"
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => router.push("/marketplace")}
            className="cursor-pointer text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Marketplace
          </button>

          <button
            type="button"
            onClick={() => router.push("/earnings")}
            className="cursor-pointer text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Earnings
          </button>

          <button
            type="button"
            onClick={() => router.push("/qualifications")}
            className="cursor-pointer text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Quality
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Applications */}
          <button
            type="button"
            aria-label="Applications"
            className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white sm:flex"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="5" cy="5" r="2" />
              <circle cx="12" cy="5" r="2" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
              <circle cx="5" cy="19" r="2" />
              <circle cx="12" cy="19" r="2" />
              <circle cx="19" cy="19" r="2" />
            </svg>
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => router.push("/notifications")}
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M10 21h4"
                strokeLinecap="round"
              />
            </svg>

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-400" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setProfileOpen((previous) => !previous)
              }
              className="flex cursor-pointer items-center gap-2 rounded-full transition hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">
                {initials}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1b1e24] shadow-2xl">
                <div className="border-b border-white/10 px-4 py-4">
                  <p className="truncate text-sm font-semibold text-white">
                    {user?.name || "User"}
                  </p>

                  <p className="mt-1 truncate text-xs text-gray-400">
                    {user?.email || ""}
                  </p>

                  <span className="mt-2 inline-block rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs text-indigo-300">
                    {user?.role || "USER"}
                  </span>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/setting");
                    }}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Setting
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}