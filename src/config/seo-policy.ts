export function seoPolicy(domain: string | undefined, enabled: boolean) {
  let url: URL | null = null;
  try {
    if (domain) url = new URL(domain);
  } catch {
    /* ayar geçersizse yine indekslenmiyor. */
  }
  const host = url?.hostname.toLowerCase().replace(/\.$/, "") || "";
  const publicHost =
    host.includes(".") &&
    !host.endsWith(".localhost") &&
    !host.endsWith(".local") &&
    !/^\d+(\.\d+){3}$/.test(host);
  return {
    origin: url && /^https?:$/.test(url.protocol) ? url.origin : null,
    indexable: Boolean(
      enabled &&
        publicHost &&
        url?.protocol === "https:" &&
        !url.username &&
        !url.password,
    ),
  };
}
