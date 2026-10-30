export function withQuery(path: string, params: Record<string, string | number>) {
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&")
  return query ? `${path}?${query}` : path
}
