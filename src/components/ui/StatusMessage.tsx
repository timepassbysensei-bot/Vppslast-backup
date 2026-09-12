type Kind = "success" | "error" | "info";

const CLASS: Record<Kind, string> = {
  success: "bg-green-50 text-success border-success/30",
  error: "bg-red-50 text-danger border-danger/30",
  info: "bg-surface text-ink border-ink/20",
};

export function StatusMessage({ kind, children }: { kind: Kind; children: React.ReactNode }) {
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`border rounded-card px-3 py-2 text-sm ${CLASS[kind]}`}>
      {children}
    </div>
  );
}
