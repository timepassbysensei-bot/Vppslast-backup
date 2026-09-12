import { useCallback, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { NAV_ITEMS, LEGAL_ITEMS } from "@/lib/nav";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
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
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      document.body.classList.remove("scroll-lock");
      lastFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t("nav.menu")}>
      <div className="absolute inset-0 bg-black/50" onMouseDown={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        onKeyDown={onKeyDown}
        className="absolute right-0 top-0 h-full w-4/5 max-w-xs bg-bg shadow-card overflow-auto p-4"
      >
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-navy">{t("nav.menu")}</span>
          <button type="button" className="btn btn-ghost p-2" aria-label={t("nav.closeMenu")} onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={t("nav.menu")}>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block px-3 py-3 rounded-card min-h-touch ${isActive ? "bg-navy text-white" : "hover:bg-surface"}`
                  }
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 border-t pt-2">
              <NavLink to="/admin/login" onClick={onClose} className="block px-3 py-3 rounded-card min-h-touch text-navy font-semibold">
                {t("nav.teacherLogin")}
              </NavLink>
            </li>
            {LEGAL_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} onClick={onClose} className="block px-3 py-2 rounded-card text-sm text-ink/70">
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
