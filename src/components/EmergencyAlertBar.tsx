import { useEmergencyAlert } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";
import { pickText } from "@/lib/content";
import { AlertTriangle, Info, AlertOctagon } from "lucide-react";

const STYLE = {
  info: "bg-navy text-white",
  warning: "bg-amber text-ink",
  critical: "bg-danger text-white",
} as const;

const ICON = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
} as const;

export function EmergencyAlertBar() {
  const { data: alert } = useEmergencyAlert();
  const lang = useLang();
  if (!alert) return null;
  const { value } = pickText(alert.message_en, alert.message_hi, lang);
  if (!value) return null;
  const Icon = ICON[alert.severity];

  return (
    <div className={`${STYLE[alert.severity]} px-4 py-2 text-sm`} role="region" aria-label="Emergency alert">
      <div className="container-page flex items-center gap-2 justify-center text-center">
        <Icon aria-hidden="true" size={18} className="shrink-0" />
        <span>{value}</span>
        {alert.link_url ? (
          <a href={alert.link_url} className="underline font-semibold" rel="noopener noreferrer">
            {alert.link_url.startsWith("http") ? "→" : "→"}
          </a>
        ) : null}
      </div>
    </div>
  );
}
