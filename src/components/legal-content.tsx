import { text, pathFor, type Locale } from "@/i18n/routing";
import Link from "next/link";
import { PageIntro } from "./ui";

export function LegalContent({
  kind,
  locale = "tr",
}: {
  kind: "privacy" | "kvkk";
  locale?: Locale;
}) {
  return (
    <>
      <PageIntro
        label={text(
          locale,
          "Yasal bilgiler / Hazırlık alanı",
          "Legal information / Draft",
        )}
        title={
          kind === "privacy"
            ? text(locale, "Gizlilik bilgileri.", "Privacy information.")
            : text(locale, "KVKK aydınlatma alanı.", "Data protection notice.")
        }
        description={text(
          locale,
          "Bu sayfa, yayından önce gerçek ticari bilgiler ve onaylanmış hukuki metinle tamamlanacak bir hazırlık alanıdır.",
          "This draft page will be completed with verified business details and approved legal text before publication.",
        )}
      />
      <div className="surface-day legal-surface">
      <div className="legal-page container">
        <article className="prose">
          <p className="notice">
            {text(
              locale,
              "Taslak yapı — kesinleşmiş bir hukuki metin değildir. Veri sorumlusu bilgileri ve işleme koşulları yayın öncesinde tamamlanmalıdır.",
              "Draft — this is not a final legal notice. Data controller details and processing terms must be completed before publication.",
            )}
          </p>
          <h2>
            {text(
              locale,
              "Mevcut uygulamanın işleyişi",
              "How the current application works",
            )}
          </h2>
          <p>
            {text(
              locale,
              "İletişim formu ad soyad, e-posta adresi, hizmet tercihi ve mesajınızı alır. Şirket, tahmini bütçe ve hedef tarih isteğe bağlıdır. Gönderim etkinleştirildiğinde bu bilgiler talebinizi değerlendirmek ve yanıtlamak için e-posta ile iletilir. Doğrudan e-posta bağlantısı cihazınızdaki e-posta uygulamasını açar.",
              "The contact form collects your full name, email address, service choice and message. Company, estimated budget and target date are optional. Once delivery is enabled, these details are sent by email to assess and answer your enquiry. Direct email links open the email application on your device.",
            )}
          </p>
          <h2>
            {text(
              locale,
              "Yayın öncesinde tamamlanacak bilgiler",
              "Information to complete before publication",
            )}
          </h2>
          <ul>
            <li>
              {text(
                locale,
                "Veri sorumlusunun ticari unvanı, adresi ve başvuru kanalları",
                "The data controller’s legal name, address and contact channels",
              )}
            </li>
            <li>
              {text(
                locale,
                "İşleme amaçları, hukuki sebepler ve veri toplama yöntemleri",
                "Processing purposes, legal bases and collection methods",
              )}
            </li>
            <li>
              {text(
                locale,
                "Alıcı grupları, hizmet sağlayıcılar ve varsa yurt dışı aktarım koşulları",
                "Recipient groups, service providers and any international transfer arrangements",
              )}
            </li>
            <li>
              {text(
                locale,
                "Saklama ve silme süreleri ile ilgili kişi başvuru yöntemi",
                "Retention and deletion periods, and how to exercise data subject rights",
              )}
            </li>
          </ul>
          <h2>
            {text(
              locale,
              "Teknik uygulama notları",
              "Technical implementation notes",
            )}
          </h2>
          <p>
            {text(
              locale,
              "Bu uygulamaya analiz veya reklam izleyicisi eklenmemiştir. Formda Resend e-posta servisi ve Upstash Redis gönderim sınırı kullanılır. Sınırlandırma için ham IP yerine anahtarlı özet tutulur; sayaçlar 10 dakika sonra silinir. E-posta ve barındırma sağlayıcılarının veri işleme koşulları ayrıca değerlendirilmelidir.",
              "This application has no analytics or advertising trackers. The form uses Resend for email and Upstash Redis for rate limiting. A keyed hash is stored instead of the raw IP address; counters expire after 10 minutes. The email and hosting providers’ data processing terms need separate review.",
            )}
          </p>
          <p>
            {text(
              locale,
              "Bu açıklamalar hukuki incelemenin yerini tutmaz. Onaylı metin hazırlandığında sayfanın içeriği değiştirilmeli, teknik yapılandırma ile tutarlılığı kontrol edilmelidir.",
              "These notes do not replace legal review. Once approved text is available, this page must be updated and checked against the technical configuration.",
            )}
          </p>
          <p>
            <Link
              prefetch={false}
              className="text-link"
              href={pathFor(locale, "contact")}
            >
              {text(locale, "İletişim sayfasına dön", "Return to contact")}
            </Link>
          </p>
        </article>
      </div>
      </div>
    </>
  );
}
