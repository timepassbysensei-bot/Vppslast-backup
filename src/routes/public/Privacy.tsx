import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { useSettings } from "@/hooks/public";
import { useLang } from "@/hooks/useLang";

export function Privacy() {
  const { t } = useTranslation();
  const lang = useLang();
  const { data: settings } = useSettings();
  const contact = settings?.privacy_contact || settings?.email || "";

  const en = (
    <div className="prose max-w-none text-ink/80 space-y-3">
      <p>
        This website is operated by the school to share public information with students, parents, and the community.
        We collect personal details only when you voluntarily submit a form (for example, an admission enquiry or a
        message to the school).
      </p>
      <p>
        Information submitted through forms is used solely to respond to your request and is accessible only to
        authorised school staff. We do not sell or share this information with unrelated third parties.
      </p>
      <p>
        Student birthday information shown publicly is limited to a display name, class, and greeting. Dates of birth
        and other private details are never displayed publicly.
      </p>
      {contact ? <p>For any privacy question or request, please contact: {contact}.</p> : null}
    </div>
  );

  const hi = (
    <div className="prose max-w-none text-ink/80 space-y-3">
      <p>
        यह वेबसाइट विद्यालय द्वारा विद्यार्थियों, अभिभावकों और समुदाय के साथ सार्वजनिक जानकारी साझा करने के लिए
        संचालित की जाती है। हम व्यक्तिगत विवरण केवल तभी एकत्र करते हैं जब आप स्वेच्छा से कोई फ़ॉर्म भरते हैं (उदाहरण के
        लिए, प्रवेश पूछताछ या विद्यालय को संदेश)।
      </p>
      <p>
        फ़ॉर्म के माध्यम से दी गई जानकारी केवल आपके अनुरोध का उत्तर देने के लिए उपयोग की जाती है और केवल अधिकृत विद्यालय
        स्टाफ के लिए ही सुलभ है। हम इस जानकारी को असंबंधित तृतीय पक्षों को नहीं बेचते या साझा नहीं करते।
      </p>
      <p>
        सार्वजनिक रूप से दिखाई जाने वाली विद्यार्थी जन्मदिन जानकारी केवल प्रदर्शन नाम, कक्षा और शुभकामना तक सीमित है।
        जन्म तिथि और अन्य निजी विवरण कभी सार्वजनिक रूप से प्रदर्शित नहीं किए जाते।
      </p>
      {contact ? <p>किसी भी गोपनीयता प्रश्न या अनुरोध के लिए कृपया संपर्क करें: {contact}।</p> : null}
    </div>
  );

  return (
    <PageShell title={t("nav.privacy")} path="/privacy">
      {lang === "hi" ? hi : en}
    </PageShell>
  );
}
