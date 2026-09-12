import { useRef, useState, type ReactNode } from "react";

export type TabDef = { id: string; label: string; node: ReactNode };

export function Tabs({ tabs, initial }: { tabs: TabDef[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id ?? "");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent, index: number): void {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + dir + tabs.length) % tabs.length];
    if (next) {
      setActive(next.id);
      refs.current[next.id]?.focus();
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-1 border-b border-ink/10 mb-4 overflow-x-auto">
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => (refs.current[tab.id] = el)}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => setActive(tab.id)}
              className={`px-3 py-2 min-h-touch rounded-t-card text-sm font-semibold whitespace-nowrap ${
                selected ? "bg-navy text-white" : "text-ink/70 hover:bg-surface"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.id === active ? tab.node : null}
        </div>
      ))}
    </div>
  );
}
