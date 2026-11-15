import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchField({
  value,
  onChange,
  placeholder = "Search name, tag or notes…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search bikes"
        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 active:bg-slate-100"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
