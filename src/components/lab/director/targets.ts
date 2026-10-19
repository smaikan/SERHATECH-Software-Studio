import { createTargets } from "./store";

// ana sayfa için tek, ortak hedef nesnesi. kaydırma koreografisi webgl çalışsa da
// çalışmasa da buna yazıyor, webgl director'ı sadece okuyor.
export const labTargets = createTargets();

export function resetTargets() {
  Object.assign(labTargets, createTargets());
}
