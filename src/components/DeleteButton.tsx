import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useDeleteContent, type DeleteContentType } from "@/hooks/actions";
import { FunctionError } from "@/lib/functions";

type Props = {
  contentType: DeleteContentType;
  recordId: string;
  disabled?: boolean;
  label?: string;
};

// Permanent-delete control: opens a confirmation dialog that clearly states the
// action is irreversible, then calls the server delete-content function.
export function DeleteButton({ contentType, recordId, disabled, label }: Props) {
  const { t } = useTranslation();
  const del = useDeleteContent();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(): Promise<void> {
    setError(null);
    try {
      await del.mutateAsync({ content_type: contentType, record_id: recordId });
      setOpen(false);
    } catch (err) {
      setError(err instanceof FunctionError ? err.message : t("confirm.deleteFailed"));
    }
  }

  return (
    <>
      <Button variant="danger" className="px-3 py-1 text-sm" disabled={disabled} onClick={() => setOpen(true)}>
        <Trash2 size={16} aria-hidden="true" />
        {label ?? t("common.deletePermanent")}
      </Button>
      {error ? (
        <div className="mt-1">
          <StatusMessage kind="error">{error}</StatusMessage>
        </div>
      ) : null}
      <ConfirmDialog
        open={open}
        loading={del.isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
