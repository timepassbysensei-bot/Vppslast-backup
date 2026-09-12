import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, children, footer }: Props) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    document.body.classList.add("scroll-lock");
    const panel = panelRef.current;
    const focusTarget = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    focusTarget?.focus();

    return () => {
      document.body.classList.remove("scroll-lock");
      lastFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="card w-full sm:max-w-lg max-h-[90vh] overflow-auto rounded-t-2xl sm:rounded-card p-4 sm:p-5 outline-none"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" className="btn btn-ghost p-2" aria-label={t("common.close")} onClick={onClose}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <div>{children}</div>
        {footer ? <div className="mt-4 flex flex-wrap gap-2 justify-end">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
