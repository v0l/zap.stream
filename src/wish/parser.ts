// adopted from https://github.com/thlorenz/parse-link-header
function parseLink(link: string): Link | null {
  const matches = link.match(/<?([^>]*)>(.*)/);
  if (!matches) {
    return null;
  }
  try {
    const linkUrl = matches[1];
    const parts = matches[2].split(";");
    const parsedUrl = new URL(linkUrl);
    const qs = parsedUrl.searchParams;

    parts.shift();

    const initial: Link = { rel: "", url: linkUrl };
    const reduced = parts.reduce((acc: Link, p) => {
      const m = p.match(/\s*(.+)\s*=\s*"?([^"]+)"?/);
      if (m) {
        acc[m[1]] = m[2];
      }
      return acc;
    }, initial);

    if (!reduced.rel) {
      return null;
    }

    qs.forEach((v, k) => {
      reduced[k] = v;
    });

    return reduced;
  } catch (e) {
    return null;
  }
}

// https://stackoverflow.com/a/46700791
function notEmpty<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const testDummy: T = value;
  return true;
}

export interface Link {
  rel: string;
  url: string;
  [key: string]: string;
}

export interface Links {
  [key: string]: Link;
}

export function parserLinkHeader(links: string): Links {
  return links
    .split(/,\s*</)
    .map(parseLink)
    .filter(notEmpty)
    .reduce((links, l) => {
      links[l.rel] = l;
      return links;
    }, {} as Links);
}
