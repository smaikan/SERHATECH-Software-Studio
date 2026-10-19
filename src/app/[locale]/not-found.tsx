import { locale as rootLocale } from "next/root-params";
import { MissingPage } from "@/views/not-found";
export default async function NotFound() {
  return <MissingPage locale={(await rootLocale()) === "en" ? "en" : "tr"} />;
}
