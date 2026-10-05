"use client";

interface MarketplaceFiltersProps {
  search: string;
  category: string;
  status: string;

  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function MarketplaceFilters({
  search,
  category,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: MarketplaceFiltersProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1a1d23] p-5">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />

            <path
              d="m20 20-4-4"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search projects..."
            className="w-full rounded-xl border border-white/10 bg-[#15181d] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-400/40"
          />
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value)
          }
          className="cursor-pointer rounded-xl border border-white/10 bg-[#15181d] px-4 py-3 text-sm text-gray-300 outline-none focus:border-indigo-400/40"
        >
          <option value="all">All Categories</option>
          <option value="text">Text Evaluation</option>
          <option value="image">Computer Vision</option>
          <option value="code">Code Evaluation</option>
          <option value="audio">Audio Evaluation</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value)
          }
          className="cursor-pointer rounded-xl border border-white/10 bg-[#15181d] px-4 py-3 text-sm text-gray-300 outline-none focus:border-indigo-400/40"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="qualification">
            Qualification
          </option>
        </select>
      </div>
    </section>
  );
}