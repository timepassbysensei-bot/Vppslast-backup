import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  body?: string;
  confirmLabel?: string;
};

export function ConfirmDialog({ open, onCancel, onConfirm, loading, title, body, confirmLabel }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title ?? t("confirm.deleteTitle")}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {confirmLabel ?? t("confirm.confirm")}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-danger shrink-0" aria-hidden="true" />
        <p>{body ?? t("confirm.deleteBody")}</p>
      </div>
    </Dialog>
  );
}
