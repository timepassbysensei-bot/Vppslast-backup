import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { callAuthed, FunctionError } from "@/lib/functions";

type Kind = "resource" | "leave_attachment" | "internal_notice" | "parent_attachment";

// Requests a short-lived signed URL from the server (row-authorized) and opens
// it. Private files never have a public direct URL.
export function SignedFileLink({ kind, recordId, label }: { kind: Kind; recordId: string; label?: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await callAuthed<{ url: string }>("signed-file", { kind, record_id: recordId });
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof FunctionError ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button type="button" className="btn btn-outline px-3 py-1 text-sm" disabled={busy} onClick={() => void open()}>
        <Download size={16} aria-hidden="true" />
        {label ?? t("common.attachment")}
      </button>
      {error ? <span className="field-error">{error}</span> : null}
    </span>
  );
}
