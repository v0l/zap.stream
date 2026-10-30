export async function resolveMessages<T>(
  locale: string,
  match: (lng: string) => Promise<T | undefined>,
  fallback: T,
): Promise<T> {
  const truncated = locale.toLowerCase().split(/[_-]+/)[0]
  return (await match(locale)) ?? (await match(truncated)) ?? fallback
}
