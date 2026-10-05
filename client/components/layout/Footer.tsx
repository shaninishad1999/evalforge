import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pt-8 border-t border-white/10 bg-[#0d0f13]">
      <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/dashboard"
              className="inline-flex cursor-pointer items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white">
                EF
              </div>

              <span className="text-xl font-semibold tracking-tight text-white">
                EvalForge
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-gray-500">
              AI training and evaluation platform connecting
              skilled contributors with high-quality AI
              projects and opportunities.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Platform
            </h3>

            <div className="mt-4 space-y-3">
              <Link
                href="/dashboard"
                className="block cursor-pointer text-sm text-gray-500 transition hover:text-white"
              >
                Dashboard
              </Link>

              <Link
                href="/marketplace"
                className="block cursor-pointer text-sm text-gray-500 transition hover:text-white"
              >
                Marketplace
              </Link>

              <Link
                href="/earnings"
                className="block cursor-pointer text-sm text-gray-500 transition hover:text-white"
              >
                Earnings
              </Link>

              <Link
                href="/notifications"
                className="block cursor-pointer text-sm text-gray-500 transition hover:text-white"
              >
                Notifications
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Account
            </h3>

            <div className="mt-4 space-y-3">
              <Link
                href="/profile"
                className="block cursor-pointer text-sm text-gray-500 transition hover:text-white"
              >
                Profile
              </Link>

              <Link
                href="/setting"
                className="block cursor-pointer text-sm text-gray-500 transition hover:text-white"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600">
            © 2026 EvalForge. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="#"
              className="cursor-pointer text-xs text-gray-600 transition hover:text-gray-300"
            >
              Privacy Policy
            </Link>

            <Link
              href="#"
              className="cursor-pointer text-xs text-gray-600 transition hover:text-gray-300"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}