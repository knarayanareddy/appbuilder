import { Bike, Grid3x3, KeyRound, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tab } from "@/types";

const ITEMS: { id: Tab; label: string; Icon: typeof Bike }[] = [
  { id: "lot", label: "Lot", Icon: Grid3x3 },
  { id: "bikes", label: "Bikes", Icon: Bike },
  { id: "keys", label: "Keys", Icon: KeyRound },
  { id: "settings", label: "Settings", Icon: Settings },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="safe-bottom sticky bottom-0 border-t border-slate-200 bg-white/95 pt-1 backdrop-blur">
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition-colors",
                  active ? "text-slate-900" : "text-slate-400"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
