"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationType =
  | "PROJECT"
  | "ASSIGNMENT"
  | "QUALIFICATION"
  | "SKILL"
  | "TASK"
  | "REVIEW";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  href: string;
  unread: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "PROJECT",
    title: "New Project Available",
    description:
      "Code Response Review is now available in Marketplace.",
    time: "5 min ago",
    href: "/marketplace",
    unread: true,
  },
  {
    id: "2",
    type: "ASSIGNMENT",
    title: "Project Assigned",
    description:
      "You have been assigned to AI Response Evaluation.",
    time: "1 hour ago",
    href: "/marketplace",
    unread: true,
  },
  {
    id: "3",
    type: "QUALIFICATION",
    title: "Qualification Added",
    description:
      "A new qualification is available for your project.",
    time: "3 hours ago",
    href: "/marketplace",
    unread: true,
  },
  {
    id: "4",
    type: "SKILL",
    title: "Skill Verification",
    description:
      "React.js skill verification has been added to your profile.",
    time: "Yesterday",
    href: "/profile",
    unread: false,
  },
  {
    id: "5",
    type: "REVIEW",
    title: "Qualification Result",
    description:
      "You passed the qualification for AI Response Evaluation.",
    time: "Yesterday",
    href: "/marketplace",
    unread: false,
  },
];

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  const baseClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm";

  switch (type) {
    case "PROJECT":
      return (
        <div
          className={`${baseClass} bg-indigo-500/10 text-indigo-300`}
        >
          ◇
        </div>
      );

    case "ASSIGNMENT":
      return (
        <div
          className={`${baseClass} bg-emerald-500/10 text-emerald-300`}
        >
          ✓
        </div>
      );

    case "QUALIFICATION":
      return (
        <div
          className={`${baseClass} bg-violet-500/10 text-violet-300`}
        >
          ?
        </div>
      );

    case "SKILL":
      return (
        <div
          className={`${baseClass} bg-cyan-500/10 text-cyan-300`}
        >
          ◆
        </div>
      );

    case "TASK":
      return (
        <div
          className={`${baseClass} bg-amber-500/10 text-amber-300`}
        >
          ◷
        </div>
      );

    case "REVIEW":
      return (
        <div
          className={`${baseClass} bg-pink-500/10 text-pink-300`}
        >
          ★
        </div>
      );

    default:
      return null;
  }
}

export default function NotificationDropdown() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(
      initialNotifications
    );

  const notificationRef =
    useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  // Close popup when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleNotificationClick = (
    notification: NotificationItem
  ) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              unread: false,
            }
          : item
      )
    );

    setOpen(false);

    router.push(notification.href);
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  return (
    <div
      ref={notificationRef}
      className="relative"
    >
      {/* Notification Button */}
      <button
        type="button"
        aria-label="Notifications"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-[#1a1d23] text-gray-400 transition hover:border-white/20 hover:text-white"
      >
        <svg
          width="18"
          height="18"
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

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-semibold text-white">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Popup */}
      {open && (
        <div
          className="
            absolute
            right-0
            top-12
            z-[100]
            w-[380px]
            max-w-[calc(100vw-24px)]
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-[#1a1d23]
            shadow-2xl
            shadow-black/40

            sm:w-[380px]

            max-sm:fixed
            max-sm:left-3
            max-sm:right-3
            max-sm:top-[76px]
            max-sm:w-auto
            max-sm:max-w-none
          "
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">
                Notifications
              </h2>

              <p className="mt-1 text-[11px] text-gray-600">
                Project and work updates
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex shrink-0 items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="cursor-pointer whitespace-nowrap text-[11px] font-medium text-indigo-400 transition hover:text-indigo-300"
                >
                  Mark all as read
                </button>
              )}

              {/* X Close Button */}
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/10 hover:text-white"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 6l12 12"
                    strokeLinecap="round"
                  />

                  <path
                    d="M18 6L6 18"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[430px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-600">
                  ✓
                </div>

                <p className="mt-3 text-sm text-gray-400">
                  No notifications
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                  className={`flex w-full cursor-pointer gap-3 border-b border-white/5 px-4 py-4 text-left transition last:border-b-0 hover:bg-white/[0.03] sm:px-5 ${
                    notification.unread
                      ? "bg-indigo-500/[0.025]"
                      : ""
                  }`}
                >
                  <NotificationIcon
                    type={notification.type}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-xs font-medium text-gray-200">
                        {notification.title}
                      </p>

                      {notification.unread && (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                      )}
                    </div>

                    <p className="mt-1 text-[11px] leading-5 text-gray-500">
                      {notification.description}
                    </p>

                    <p className="mt-2 text-[10px] text-gray-700">
                      {notification.time}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}