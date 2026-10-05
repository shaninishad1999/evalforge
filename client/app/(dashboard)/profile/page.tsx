"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const MAX_SUMMARY_LENGTH = 200;

export default function ProfilePage() {
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);

  // Secondary Email
  const [secondaryEmail, setSecondaryEmail] =
    useState("");

  const [secondaryEmailOpen, setSecondaryEmailOpen] =
    useState(false);

  const [secondaryEmailSaved, setSecondaryEmailSaved] =
    useState(false);

  // Professional Summary
  const [summaryEditing, setSummaryEditing] =
    useState(false);

  const initialSummary =
    "professionalSummary" in (user || {})
      ? String(
          (user as AuthUserProfile)
            .professionalSummary || ""
        )
      : "";

  const [professionalSummary, setProfessionalSummary] =
    useState(initialSummary);

  const [summaryDraft, setSummaryDraft] =
    useState(initialSummary);

  const initials =
    user?.name
      ?.split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EF";

  const roleLabel =
    user?.role
      ?.replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Contributor";

  const isActive = user?.isActive !== false;

  const mobileNumber =
    "mobileNumber" in (user || {})
      ? String(
          (user as AuthUserProfile).mobileNumber || ""
        )
      : "";

  const clientId = user?._id || "";

  // --------------------------------
  // Copy Client ID
  // --------------------------------

  const handleCopyClientId = async () => {
    if (!clientId) return;

    try {
      await navigator.clipboard.writeText(clientId);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  // --------------------------------
  // Secondary Email
  // --------------------------------

  const handleSecondaryEmailSave = () => {
    const trimmedEmail = secondaryEmail.trim();

    if (!trimmedEmail) {
      return;
    }

    setSecondaryEmail(trimmedEmail);
    setSecondaryEmailSaved(true);
    setSecondaryEmailOpen(false);
  };

  const handleSecondaryEmailEdit = () => {
    setSecondaryEmailOpen(true);
    setSecondaryEmailSaved(false);
  };

  const handleSecondaryEmailCancel = () => {
    setSecondaryEmailOpen(false);

    if (!secondaryEmailSaved) {
      setSecondaryEmail("");
    }
  };

  // --------------------------------
  // Professional Summary
  // --------------------------------

  const handleSummaryEdit = () => {
    setSummaryDraft(professionalSummary);
    setSummaryEditing(true);
  };

  const handleSummaryCancel = () => {
    setSummaryDraft(professionalSummary);
    setSummaryEditing(false);
  };

  const handleSummarySave = () => {
    const trimmedSummary = summaryDraft
      .trim()
      .slice(0, MAX_SUMMARY_LENGTH);

    setProfessionalSummary(trimmedSummary);
    setSummaryDraft(trimmedSummary);
    setSummaryEditing(false);
  };

  return (
    <main className="min-h-screen bg-[#111318] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">
            Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your personal and professional information.
          </p>
        </div>

        {/* -------------------------------- */}
        {/* Profile Header */}
        {/* -------------------------------- */}

        <section className="rounded-xl border border-white/10 bg-[#1a1d23]">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              {/* Profile Photo */}
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xl font-bold text-white">
                  {initials}
                </div>

                {/* Upload Button */}
                <label
                  htmlFor="profile-photo"
                  title="Upload profile photo"
                  className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-[#1a1d23] bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  +
                </label>

                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">
                  {user?.name || "Test Client"}
                </h2>

                {/* Client ID */}
                <div className="mt-1 flex max-w-full items-center gap-2">
                  <p className="truncate text-xs text-gray-500">
                    {clientId ||
                      "Client ID not available"}
                  </p>

                  {clientId && (
                    <button
                      type="button"
                      onClick={handleCopyClientId}
                      title="Copy Client ID"
                      className="shrink-0 cursor-pointer rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-gray-400 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-300"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>

                {/* Role + Status */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300">
                    {roleLabel}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------- */}
        {/* Profile Content */}
        {/* -------------------------------- */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* -------------------------------- */}
          {/* Personal Information */}
          {/* -------------------------------- */}

          <section className="rounded-xl border border-white/10 bg-[#1a1d23]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Personal Information
              </h2>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <InfoItem
                label="Client ID"
                value={
                  user?._id || "Not available"
                }
              />

              <InfoItem
                label="Full Name"
                value={
                  user?.name || "Test Client"
                }
              />

              <InfoItem
                label="Email Address"
                value={
                  user?.email || "Not available"
                }
              />

              <InfoItem
                label="Mobile Number"
                value={
                  mobileNumber || "Not added"
                }
              />

              <InfoItem
                label="Account Role"
                value={roleLabel}
              />

              <InfoItem
                label="Account Status"
                value={
                  isActive ? "Active" : "Inactive"
                }
                valueClassName={
                  isActive
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              />

              {/* Secondary Email */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-600">
                    Secondary Email
                  </p>

                  <span className="text-[10px] text-gray-600">
                    Optional
                  </span>
                </div>

                {/* Default State */}
                {!secondaryEmailOpen &&
                  !secondaryEmailSaved && (
                    <button
                      type="button"
                      onClick={() =>
                        setSecondaryEmailOpen(true)
                      }
                      className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs text-gray-500 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-300"
                    >
                      <span className="text-base leading-none">
                        +
                      </span>

                      Add Secondary Email
                    </button>
                  )}

                {/* Add / Edit Form */}
                {secondaryEmailOpen && (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={secondaryEmail}
                      onChange={(event) => {
                        setSecondaryEmail(
                          event.target.value
                        );
                      }}
                      placeholder="Enter secondary email"
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#15181d] px-3 py-2.5 text-sm text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-400/40"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={
                          handleSecondaryEmailSave
                        }
                        disabled={
                          !secondaryEmail.trim()
                        }
                        className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-gray-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleSecondaryEmailCancel
                        }
                        className="cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Saved Email */}
                {!secondaryEmailOpen &&
                  secondaryEmailSaved &&
                  secondaryEmail && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2.5">
                      <p className="truncate text-xs text-emerald-400">
                        {secondaryEmail}
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleSecondaryEmailEdit
                        }
                        className="shrink-0 cursor-pointer text-[10px] text-gray-500 transition hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </section>

          {/* -------------------------------- */}
          {/* Professional Information */}
          {/* -------------------------------- */}

          <section className="rounded-xl border border-white/10 bg-[#1a1d23]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Professional Information
              </h2>

              {!summaryEditing && (
                <button
                  type="button"
                  onClick={handleSummaryEdit}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-600">
                  Professional Summary
                </p>

                {summaryEditing && (
                  <span
                    className={`text-[10px] ${
                      summaryDraft.length >=
                      MAX_SUMMARY_LENGTH
                        ? "text-amber-400"
                        : "text-gray-600"
                    }`}
                  >
                    {summaryDraft.length}/
                    {MAX_SUMMARY_LENGTH}
                  </span>
                )}
              </div>

              {summaryEditing ? (
                <>
                  <textarea
                    value={summaryDraft}
                    onChange={(event) =>
                      setSummaryDraft(
                        event.target.value.slice(
                          0,
                          MAX_SUMMARY_LENGTH
                        )
                      )
                    }
                    maxLength={MAX_SUMMARY_LENGTH}
                    rows={5}
                    placeholder="Write your professional summary..."
                    className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#15181d] p-4 text-sm leading-6 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-indigo-400/40"
                  />

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSummaryCancel}
                      className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSummarySave}
                      className="cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-indigo-400"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-2 min-h-[120px] rounded-lg border border-white/10 bg-[#15181d] p-4">
                  <p className="text-sm leading-6 text-gray-300">
                    {professionalSummary ||
                      "No professional summary added yet."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* -------------------------------- */}
          {/* Verification */}
          {/* -------------------------------- */}

          <section className="rounded-xl border border-white/10 bg-[#1a1d23]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Verification
              </h2>
            </div>

            <div className="divide-y divide-white/5">
              <VerificationRow
                title="Email Verification"
                status="Verified"
                verified
              />

              <VerificationRow
                title="Identity Verification"
                status="Pending"
                verified={false}
              />

              <VerificationRow
                title="Face Verification"
                status="Pending"
                verified={false}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------- */
/* Profile Type */
/* -------------------------------- */

interface AuthUserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  mobileNumber?: string;
  professionalSummary?: string;
}

/* -------------------------------- */
/* Info Item */
/* -------------------------------- */

function InfoItem({
  label,
  value,
  valueClassName = "text-gray-200",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-600">
        {label}
      </p>

      <p
        className={`mt-2 truncate text-sm ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------- */
/* Verification Row */
/* -------------------------------- */

function VerificationRow({
  title,
  status,
  verified,
}: {
  title: string;
  status: string;
  verified: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
            verified
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {verified ? "✓" : "!"}
        </span>

        <span className="truncate text-sm text-gray-300">
          {title}
        </span>
      </div>

      <span
        className={`shrink-0 text-xs ${
          verified
            ? "text-emerald-400"
            : "text-amber-400"
        }`}
      >
        {status}
      </span>
    </div>
  );
}