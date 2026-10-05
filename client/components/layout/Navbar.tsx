"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import NotificationDropdown from "@/components/layout/NotificationDropdown";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    setProfileOpen(false);

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
        <Link
          href="/dashboard"
          className="flex cursor-pointer items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white">
            EF
          </div>

          <span className="text-xl font-semibold tracking-tight text-white">
            EvalForge
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/dashboard"
            className="cursor-pointer text-sm font-medium text-white transition hover:text-indigo-300"
          >
            Home
          </Link>

          <Link
            href="/marketplace"
            className="cursor-pointer text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Marketplace
          </Link>

          <Link
            href="/earnings"
            className="cursor-pointer text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Earnings
          </Link>

          <Link
            href="/quality"
            className="cursor-pointer text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Quality
          </Link>
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
          <NotificationDropdown />

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
              <div className="absolute right-0 top-12 z-[100] w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1b1e24] shadow-2xl">
                {/* User Info */}
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

                {/* Profile Menu */}
                <div className="p-2">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block w-full cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/setting"
                    onClick={() => setProfileOpen(false)}
                    className="block w-full cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Setting
                  </Link>

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