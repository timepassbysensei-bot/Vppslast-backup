import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { useLang } from "@/hooks/useLang";

export function Terms() {
  const { t } = useTranslation();
  const lang = useLang();

  const en = (
    <div className="text-ink/80 space-y-3">
      <p>
        The content on this website is provided for general information about the school. While we aim to keep it
        accurate and current, details such as timings, notices, and events may change. Please confirm important
        information directly with the school office.
      </p>
      <p>
        Staff accounts are provided for authorised school personnel only. Misuse of accounts or content is not
        permitted. The school may update these terms from time to time.
      </p>
    </div>
  );

  const hi = (
    <div className="text-ink/80 space-y-3">
      <p>
        इस वेबसाइट की सामग्री विद्यालय के बारे में सामान्य जानकारी हेतु प्रदान की गई है। हम इसे सटीक और अद्यतन रखने का
        प्रयास करते हैं, फिर भी समय, सूचनाएँ और कार्यक्रम बदल सकते हैं। कृपया महत्वपूर्ण जानकारी की पुष्टि सीधे विद्यालय
        कार्यालय से करें।
      </p>
      <p>
        स्टाफ खाते केवल अधिकृत विद्यालय कर्मचारियों के लिए हैं। खातों या सामग्री का दुरुपयोग वर्जित है। विद्यालय समय-समय
        पर इन शर्तों को अद्यतन कर सकता है।
      </p>
    </div>
  );

  return (
    <PageShell title={t("nav.terms")} path="/terms">
      {lang === "hi" ? hi : en}
    </PageShell>
  );
}
