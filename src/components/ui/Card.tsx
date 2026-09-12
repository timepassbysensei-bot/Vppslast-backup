import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function SectionHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-xl sm:text-2xl font-bold mb-3">
      {children}
    </h2>
  );
}
