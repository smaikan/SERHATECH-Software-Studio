import { text, type Locale } from "@/i18n/routing";
import { Suspense } from "react";
import { EmailActions } from "@/components/email-actions";
import { ContactForm } from "@/components/contact-form";
import { contactIsConfigured } from "@/lib/contact-server";
import { phoneCountries } from "@/lib/phone-countries";
import { getServices } from "@/content/english";
import { site } from "@/config/site";
type ContactQuery = Promise<{
  hizmet?: string | string[];
  service?: string | string[];
}>;

async function ContextActions({
  query,
  locale,
}: {
  query: ContactQuery;
  locale: Locale;
}) {
  const params = await query;
  const hizmet = params[locale === "en" ? "service" : "hizmet"];
  const services = getServices(locale);
  const service = services.find(({ slug }) => slug === hizmet);
  return (
    <EmailActions
      locale={locale}
      subject={
        service
          ? text(locale, `${service.title} hakkında`, `About ${service.title}`)
          : undefined
      }
    />
  );
}

async function InquiryForm({
  query,
  locale,
}: {
  query: ContactQuery;
  locale: Locale;
}) {
  const params = await query;
  const hizmet = params[locale === "en" ? "service" : "hizmet"];
  const services = getServices(locale);
  const service = services.find(({ slug }) => slug === hizmet);
  return (
    <ContactForm
      locale={locale}
      configured={contactIsConfigured()}
      initialService={service?.title}
      phoneCountries={phoneCountries(locale)}
    />
  );
}

export default function ContactPage({
  searchParams,
  locale,
}: {
  searchParams: ContactQuery;
  locale: Locale;
}) {
  return (
    <div className="surface-day contact-surface">
      <section className="contact-statement container">
        <p className="readout">{text(locale, "İletişim", "Contact")}</p>
        <h1>
          {text(locale, "İşinizi", "Your idea.")}
          <br />
          {text(locale, "konuşalım.", "Let’s talk.")}
        </h1>
        <p className="lead">
          {text(
            locale,
            "Kesinleşmiş bir teknik dokümana gerek yok. İşinizi, çözmek istediğiniz sorunu ve aklınızdakini kısaca anlatmanız yeterli. İsterseniz telefon numaranızı bırakın; size telefonla dönüş yapılır.",
            "You don’t need a finished technical specification. A short description of your business, the problem to solve and what you have in mind is enough. Leave a phone number if you would prefer a call back.",
          )}
        </p>
      </section>
      <section className="contact-inquiry container" aria-labelledby="inquiry-title">
        <div className="inquiry-intro">
          <h2 id="inquiry-title">
            {text(locale, "Projenizi anlatın.", "Tell me about your project.")}
          </h2>
          <p>
            {text(
              locale,
              "Ad, e-posta, konu ve mesaj zorunludur; diğer alanlar isteğe bağlıdır. Geri arama isterseniz telefon numaranızı da ekleyin. Talebiniz doğrudan değerlendirilir ve size dönüş yapılır.",
              "Name, email, topic and message are required; the other fields are optional. Add a phone number if you would like a call back. Your request is reviewed directly and you will get a reply.",
            )}
          </p>
          <div
            className="direct-line surface-bay bracket"
            data-theme="bay"
            aria-label={text(locale, "E-posta ile iletişim", "Contact by email")}
            role="group"
          >
            <p className="mono">{text(locale, "Doğrudan hat", "Direct line")}</p>
            <a className="contact-email-address" href={`mailto:${site.email}`}>
              {site.email.split("@")[0]}
              <span>@{site.email.split("@")[1]}</span>
            </a>
            <Suspense fallback={null}>
              <ContextActions query={searchParams} locale={locale} />
            </Suspense>
          </div>
        </div>
        <div className="inquiry-form">
          <Suspense
            fallback={
              <p role="status">{text(locale, "Form yükleniyor…", "Loading the form…")}</p>
            }
          >
            <InquiryForm query={searchParams} locale={locale} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
