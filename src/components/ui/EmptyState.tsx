import type { ReactNode } from "react";

export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="text-center text-ink/60 border border-dashed border-ink/20 rounded-card p-6">
      {icon ? <div className="flex justify-center mb-2 text-navy/60">{icon}</div> : null}
      <p>{children}</p>
    </div>
  );
}
