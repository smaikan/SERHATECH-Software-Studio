import { socialImage } from "@/lib/social-image";
export const alt = "Bağımsız yazılım ve sistem stüdyosu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return socialImage("tr");
}
