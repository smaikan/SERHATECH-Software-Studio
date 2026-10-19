import { text, type Locale } from "@/i18n/routing";
import { getProcessSteps } from "@/content/english";
import { PageIntro } from "@/components/ui";
import { ContactCallout } from "@/components/footer";
const phases = [
  ["Keşif", "Discover"],
  ["Plan", "Plan"],
  ["Geliştirme", "Build"],
  ["Yayın", "Launch"],
] as const;

function phaseName(locale: Locale, index: number) {
  const [tr, en] = phases[Math.min(Math.floor(index / 2), phases.length - 1)];
  return text(locale, tr, en);
}

export default function ProcessPage({ locale }: { locale: Locale }) {
  const processSteps = getProcessSteps(locale);
  return (
    <>
      <PageIntro
        label={text(locale, "Çalışma süreci", "Process")}
        title={
          <>
            {text(locale, "İlk görüşmeden", "From the first call")}
            <br />
            {text(locale, "yayına kadar.", "to launch.")}
          </>
        }
        description={text(
          locale,
          "Bir projenin keşif görüşmesinden yayına ve sonrasına kadar tüm aşamaları tek elden yönetilir. Teknik ayrıntıları bilmeniz gerekmez; ihtiyaç, kapsam ve bir sonraki adım her aşamada açıkça paylaşılır.",
          "Every stage of a project, from the discovery call to launch and beyond, is managed in one place. You don't need the technical details; the need, the scope and the next step are shared clearly at every stage.",
        )}
      />
      <div className="surface-day steps-surface">
      <div className="steps-list container">
        {processSteps.map((step, index) => (
          <section className="process-step" key={step.title}>
            <span className="process-step-index mono">{String(index + 1).padStart(2, "0")}</span>
            <p className="process-step-phase mono">{phaseName(locale, index)}</p>
            <h2>{step.title}</h2>
            <p>{step.detail}</p>
          </section>
        ))}
        <p className="steps-note">
          {text(
            locale,
            "Bu çerçeve bir çalışma yaklaşımıdır. Aşamalar, takvim ve destek koşulları projenin türüne göre değişir; kesin kapsam ve koşullar teklif aşamasında belirlenir.",
            "This is a framework for how I work. Stages, schedules and support depend on the project; the final scope and terms are agreed at the proposal stage.",
          )}
        </p>
      </div>
      </div>
      <ContactCallout locale={locale} />
    </>
  );
}
