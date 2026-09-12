import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { useLang } from "@/hooks/useLang";
import { useSettings } from "@/hooks/public";

export function AccessibilityPage() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: settings } = useSettings();
  const contact = settings?.email || settings?.privacy_contact || "";

  const en = (
    <div className="text-ink/80 space-y-3">
      <p>
        We want everyone to be able to use this website. We aim to meet WCAG 2.1 AA guidelines, including sufficient
        colour contrast, keyboard navigation, visible focus indicators, screen-reader labels, and large touch targets.
      </p>
      <p>
        The site works in English and Hindi and respects your reduced-motion preference. If you encounter any barrier
        or need information in another format, please let us know{contact ? ` at ${contact}` : ""}.
      </p>
    </div>
  );

  const hi = (
    <div className="text-ink/80 space-y-3">
      <p>
        हम चाहते हैं कि हर कोई इस वेबसाइट का उपयोग कर सके। हम WCAG 2.1 AA दिशानिर्देशों को पूरा करने का लक्ष्य रखते हैं,
        जिसमें पर्याप्त रंग कंट्रास्ट, कीबोर्ड नेविगेशन, स्पष्ट फ़ोकस संकेतक, स्क्रीन-रीडर लेबल और बड़े टच लक्ष्य शामिल हैं।
      </p>
      <p>
        साइट अंग्रेज़ी और हिंदी में काम करती है और आपकी रिड्यूस्ड-मोशन प्राथमिकता का सम्मान करती है। यदि आपको कोई
        बाधा मिले या किसी अन्य प्रारूप में जानकारी चाहिए, तो कृपया हमें बताएं{contact ? ` (${contact})` : ""}।
      </p>
    </div>
  );

  return (
    <PageShell title={t("nav.accessibility")} path="/accessibility">
      {lang === "hi" ? hi : en}
    </PageShell>
  );
}
