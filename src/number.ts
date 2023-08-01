const intlSats = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatShort(fmt: Intl.NumberFormat, n: number) {
  if (n < 2e3) {
    return n;
  } else if (n < 1e6) {
    return `${fmt.format(n / 1e3)}K`;
  } else if (n < 1e9) {
    return `${fmt.format(n / 1e6)}M`;
  } else {
    return `${fmt.format(n / 1e9)}G`;
  }
}

export function formatSats(n: number) {
  return formatShort(intlSats, n);
}
