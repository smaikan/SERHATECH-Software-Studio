import { ActionLink } from "@/components/ui";
import { pathFor, text, type Locale } from "@/i18n/routing";
export function MissingPage({ locale }: { locale: Locale }) {
  return (
    <div className="not-found surface-day">
      <div className="container not-found-inner">
      <p className="readout">404</p>
      <h1>{text(locale, "Bu sayfa yok.", "Page not found.")}</h1>
      <p>
        {text(
          locale,
          "Bağlantı değişmiş olabilir. Ana sayfadan devam edebilirsiniz.",
          "The link may have changed. You can continue from the home page.",
        )}
      </p>
      <ActionLink href={pathFor(locale, "home")}>
        {text(locale, "Ana sayfaya dön", "Back to home")}
      </ActionLink>
      </div>
    </div>
  );
}
