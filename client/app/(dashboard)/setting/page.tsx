"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

type SettingsSection =
  | "account"
  | "security"
  | "notifications"
  | "appearance"
  | "privacy"
  | "danger";

const menuItems: {
  id: SettingsSection;
  label: string;
}[] = [
  {
    id: "account",
    label: "Account",
  },
  {
    id: "security",
    label: "Security",
  },
  {
    id: "notifications",
    label: "Notifications",
  },
  {
    id: "appearance",
    label: "Appearance",
  },
  {
    id: "privacy",
    label: "Privacy",
  },
  {
    id: "danger",
    label: "Danger Zone",
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");

  const [twoFactor, setTwoFactor] = useState(false);

  const [projectUpdates, setProjectUpdates] =
    useState(true);

  const [qualificationUpdates, setQualificationUpdates] =
    useState(true);

  const [taskUpdates, setTaskUpdates] =
    useState(true);

  const [reviewUpdates, setReviewUpdates] =
    useState(true);

  const [paymentUpdates, setPaymentUpdates] =
    useState(true);

  const [profileVisibility, setProfileVisibility] =
    useState(true);

  const [clientVisibility, setClientVisibility] =
    useState(true);

  const [theme, setTheme] = useState("Dark");
  const [language, setLanguage] = useState("English");

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />;

      case "security":
        return (
          <SecuritySettings
            twoFactor={twoFactor}
            setTwoFactor={setTwoFactor}
          />
        );

      case "notifications":
        return (
          <NotificationSettings
            projectUpdates={projectUpdates}
            setProjectUpdates={setProjectUpdates}
            qualificationUpdates={qualificationUpdates}
            setQualificationUpdates={
              setQualificationUpdates
            }
            taskUpdates={taskUpdates}
            setTaskUpdates={setTaskUpdates}
            reviewUpdates={reviewUpdates}
            setReviewUpdates={setReviewUpdates}
            paymentUpdates={paymentUpdates}
            setPaymentUpdates={setPaymentUpdates}
          />
        );

      case "appearance":
        return (
          <AppearanceSettings
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
          />
        );

      case "privacy":
        return (
          <PrivacySettings
            profileVisibility={profileVisibility}
            setProfileVisibility={
              setProfileVisibility
            }
            clientVisibility={clientVisibility}
            setClientVisibility={
              setClientVisibility
            }
          />
        );

      case "danger":
        return <DangerSettings />;

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#111318] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Settings
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your account, security, notifications
            and preferences.
          </p>
        </div>

        {/* Settings Layout */}
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* Left Sidebar */}
          <aside className="h-fit rounded-2xl border border-white/10 bg-[#1a1d23] p-3">
            <div className="mb-3 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                Settings
              </p>
            </div>

            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActiveSection(item.id)
                    }
                    className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-3 text-left text-sm transition ${
                      isActive
                        ? "bg-indigo-500/10 text-indigo-300"
                        : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span
                      className={`mr-3 h-1.5 w-1.5 rounded-full ${
                        isActive
                          ? "bg-indigo-400"
                          : "bg-gray-700"
                      }`}
                    />

                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Content */}
          <section className="min-w-0 rounded-2xl border border-white/10 bg-[#1a1d23]">
            {renderContent()}
          </section>
        </div>
      </div>
    </main>
  );
}

/* =====================================================
   ACCOUNT
===================================================== */

function AccountSettings() {
  const { user } = useAuth();

  return (
    <div>
      <SettingsHeader
        title="Account"
        description="Manage your account information and password."
      />

      <div className="divide-y divide-white/5">
        {/* Email */}
        <SettingRow
          title="Email Address"
          description="Your primary account email address."
        >
          <div className="min-w-[220px] rounded-lg border border-white/10 bg-[#15181d] px-3 py-2.5 text-sm text-gray-400">
            {user?.email || "Loading..."}
          </div>
        </SettingRow>

        {/* Secondary Email */}
        <SettingRow
          title="Secondary Email"
          description="Add an optional backup email address."
        >
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs font-medium text-gray-400 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-300"
          >
            + Add Secondary Email
          </button>
        </SettingRow>

        {/* Password */}
        <SettingRow
          title="Change Password"
          description="Update your account password regularly for better security."
        >
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-gray-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
          >
            Change Password
          </button>
        </SettingRow>
      </div>
    </div>
  );
}

/* =====================================================
   SECURITY
===================================================== */

function SecuritySettings({
  twoFactor,
  setTwoFactor,
}: {
  twoFactor: boolean;
  setTwoFactor: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}) {
  const { user } = useAuth();

  const [sessionsOpen, setSessionsOpen] =
    useState(false);

  const [sessions, setSessions] = useState([
    {
      id: "current-session",
      device: "Windows PC",
      browser: "Chrome",
      location: "Current Device",
      lastActive: "Active now",
      current: true,
    },
    {
      id: "session-2",
      device: "Windows PC",
      browser: "Chrome",
      location: "India",
      lastActive: "2 hours ago",
      current: false,
    },
    {
      id: "session-3",
      device: "Android Device",
      browser: "Chrome Mobile",
      location: "India",
      lastActive: "Yesterday",
      current: false,
    },
  ]);

  const handleLogoutSession = (sessionId: string) => {
    setSessions((current) =>
      current.filter(
        (session) => session.id !== sessionId
      )
    );
  };

  const handleLogoutAllDevices = () => {
    setSessions((current) =>
      current.filter((session) => session.current)
    );
  };

  return (
    <div>
      <SettingsHeader
        title="Security"
        description="Protect your EvalForge account and manage active sessions."
      />

      <div className="divide-y divide-white/5">
        {/* 2FA */}
        <SettingRow
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account."
        >
          <Toggle
            enabled={twoFactor}
            onClick={() =>
              setTwoFactor((value) => !value)
            }
          />
        </SettingRow>

        {/* Active Sessions */}
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="text-sm font-medium text-gray-200">
                Active Sessions
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                View devices that are currently signed in
                to your account.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSessionsOpen(
                  (current) => !current
                )
              }
              className="w-fit shrink-0 cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-gray-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
            >
              {sessionsOpen
                ? "Hide Sessions"
                : "View Sessions"}
            </button>
          </div>

          {/* Sessions Dropdown */}
          {sessionsOpen && (
            <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#15181d]">
              {/* Session Header */}
              <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-200">
                      Signed-in Sessions
                    </p>

                    <p className="mt-1 break-all text-[11px] text-gray-600">
                      {user?.email ||
                        "Account email"}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] text-indigo-300">
                    {sessions.length}{" "}
                    {sessions.length === 1
                      ? "Session"
                      : "Sessions"}
                  </span>
                </div>
              </div>

              {/* Session List */}
              <div className="divide-y divide-white/5">
                {sessions.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-xs text-gray-500">
                      No active sessions found.
                    </p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      {/* Device Info */}
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-gray-400">
                          {session.device.includes(
                            "Android"
                          ) ? (
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            >
                              <rect
                                x="7"
                                y="2"
                                width="10"
                                height="20"
                                rx="2"
                              />
                              <path d="M11 18h2" />
                            </svg>
                          ) : (
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="14"
                                rx="2"
                              />
                              <path d="M8 21h8" />
                              <path d="M12 18v3" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-medium text-gray-200">
                              {session.device}
                            </p>

                            {session.current && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                                Current Session
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-[11px] text-gray-500">
                            {session.browser}
                            {" • "}
                            {session.location}
                          </p>

                          <p className="mt-1 text-[10px] text-gray-700">
                            {session.lastActive}
                          </p>
                        </div>
                      </div>

                      {/* Session Action */}
                      {session.current ? (
                        <span className="w-fit rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 text-[10px] text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleLogoutSession(
                              session.id
                            )
                          }
                          className="w-fit cursor-pointer rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-[10px] font-medium text-red-400 transition hover:bg-red-500/10"
                        >
                          Logout
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Info */}
              <div className="border-t border-white/10 bg-white/[0.015] px-4 py-3 sm:px-5">
                <p className="text-[10px] leading-5 text-gray-600">
                  If you don't recognize a session,
                  logout from that device immediately and
                  change your password.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Logout All Devices */}
        <SettingRow
          title="Logout All Devices"
          description="Sign out of your account on all currently active devices."
        >
          <button
            type="button"
            onClick={handleLogoutAllDevices}
            className="cursor-pointer rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Logout All Devices
          </button>
        </SettingRow>
      </div>
    </div>
  );
}

/* =====================================================
   NOTIFICATIONS
===================================================== */

function NotificationSettings({
  projectUpdates,
  setProjectUpdates,
  qualificationUpdates,
  setQualificationUpdates,
  taskUpdates,
  setTaskUpdates,
  reviewUpdates,
  setReviewUpdates,
  paymentUpdates,
  setPaymentUpdates,
}: {
  projectUpdates: boolean;
  setProjectUpdates: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  qualificationUpdates: boolean;
  setQualificationUpdates: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  taskUpdates: boolean;
  setTaskUpdates: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  reviewUpdates: boolean;
  setReviewUpdates: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  paymentUpdates: boolean;
  setPaymentUpdates: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}) {
  return (
    <div>
      <SettingsHeader
        title="Notifications"
        description="Choose which updates you want to receive."
      />

      <div className="divide-y divide-white/5">
        <NotificationRow
          title="Project Updates"
          description="Get notified when new projects become available."
          enabled={projectUpdates}
          onClick={() =>
            setProjectUpdates((value) => !value)
          }
        />

        <NotificationRow
          title="Qualification Updates"
          description="Receive updates about qualification tests and results."
          enabled={qualificationUpdates}
          onClick={() =>
            setQualificationUpdates(
              (value) => !value
            )
          }
        />

        <NotificationRow
          title="Task Updates"
          description="Receive important updates about your assigned tasks."
          enabled={taskUpdates}
          onClick={() =>
            setTaskUpdates((value) => !value)
          }
        />

        <NotificationRow
          title="Review Updates"
          description="Get notified about reviews, revisions and approvals."
          enabled={reviewUpdates}
          onClick={() =>
            setReviewUpdates((value) => !value)
          }
        />

        <NotificationRow
          title="Payment Updates"
          description="Receive notifications about earnings and payments."
          enabled={paymentUpdates}
          onClick={() =>
            setPaymentUpdates((value) => !value)
          }
        />
      </div>
    </div>
  );
}

/* =====================================================
   APPEARANCE
===================================================== */

function AppearanceSettings({
  theme,
  setTheme,
  language,
  setLanguage,
}: {
  theme: string;
  setTheme: React.Dispatch<
    React.SetStateAction<string>
  >;

  language: string;
  setLanguage: React.Dispatch<
    React.SetStateAction<string>
  >;
}) {
  return (
    <div>
      <SettingsHeader
        title="Appearance"
        description="Customize how EvalForge looks and feels."
      />

      <div className="divide-y divide-white/5">
        <SettingRow
          title="Theme"
          description="Choose your preferred application theme."
        >
          <select
            value={theme}
            onChange={(event) =>
              setTheme(event.target.value)
            }
            className="cursor-pointer rounded-lg border border-white/10 bg-[#15181d] px-4 py-2.5 text-xs text-gray-300 outline-none transition focus:border-indigo-400/40"
          >
            <option>Dark</option>
            <option>Light</option>
            <option>System</option>
          </select>
        </SettingRow>

        <SettingRow
          title="Language"
          description="Select the language used throughout the platform."
        >
          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value)
            }
            className="cursor-pointer rounded-lg border border-white/10 bg-[#15181d] px-4 py-2.5 text-xs text-gray-300 outline-none transition focus:border-indigo-400/40"
          >
            <option>English</option>
            <option>Hindi</option>
          </select>
        </SettingRow>
      </div>
    </div>
  );
}

/* =====================================================
   PRIVACY
===================================================== */

function PrivacySettings({
  profileVisibility,
  setProfileVisibility,
  clientVisibility,
  setClientVisibility,
}: {
  profileVisibility: boolean;
  setProfileVisibility: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  clientVisibility: boolean;
  setClientVisibility: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}) {
  return (
    <div>
      <SettingsHeader
        title="Privacy"
        description="Control how your profile and information are visible."
      />

      <div className="divide-y divide-white/5">
        <NotificationRow
          title="Profile Visibility"
          description="Allow your profile to be visible on the platform."
          enabled={profileVisibility}
          onClick={() =>
            setProfileVisibility(
              (value) => !value
            )
          }
        />

        <NotificationRow
          title="Client Visibility"
          description="Allow clients to view your professional profile and skills."
          enabled={clientVisibility}
          onClick={() =>
            setClientVisibility(
              (value) => !value
            )
          }
        />
      </div>
    </div>
  );
}

/* =====================================================
   DANGER ZONE
===================================================== */

function DangerSettings() {
  return (
    <div>
      <div className="border-b border-white/5 px-6 py-6 sm:px-8">
        <h2 className="text-base font-semibold text-red-400">
          Danger Zone
        </h2>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          These actions can affect your EvalForge
          account. Please proceed carefully.
        </p>
      </div>

      <div className="divide-y divide-white/5">
        {/* Deactivate */}
        <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="max-w-xl">
            <h3 className="text-sm font-medium text-gray-200">
              Deactivate Account
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Temporarily disable your account. You can
              reactivate it later.
            </p>
          </div>

          <button
            type="button"
            className="w-fit cursor-pointer rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Deactivate Account
          </button>
        </div>

        {/* Delete */}
        <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="max-w-xl">
            <h3 className="text-sm font-medium text-gray-200">
              Delete Account
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Permanently delete your account and
              associated data. This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            className="w-fit cursor-pointer rounded-lg bg-red-500 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-red-600"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   COMMON COMPONENTS
===================================================== */

function SettingsHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-white/5 px-6 py-6 sm:px-8">
      <h2 className="text-base font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {description}
      </p>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="max-w-xl">
        <h3 className="text-sm font-medium text-gray-200">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

function NotificationRow({
  title,
  description,
  enabled,
  onClick,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="max-w-xl">
        <h3 className="text-sm font-medium text-gray-200">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <Toggle
        enabled={enabled}
        onClick={onClick}
      />
    </div>
  );
}

function Toggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        enabled
          ? "Disable setting"
          : "Enable setting"
      }
      className={`relative h-6 w-11 cursor-pointer rounded-full transition ${
        enabled
          ? "bg-indigo-500"
          : "bg-gray-700"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}