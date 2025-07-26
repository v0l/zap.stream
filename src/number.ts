const intlSats = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const intlShortSats = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
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

export function formatSatsCompact(n: number) {
  return formatShort(intlShortSats, n);
}

export function formatZapAmount(n: number) {
  // For numbers less than 2000, always show full amount
  if (n < 2e3) {
    return n.toString();
  }

  // For thousands (2000+)
  if (n < 1e6) {
    const thousands = n / 1e3;
    // Only shorten if it would be a whole number (no decimals)
    if (thousands === Math.floor(thousands)) {
      return `${thousands}K`;
    }
    return n.toString();
  }

  // For millions (1M+)
  if (n < 1e9) {
    const millions = n / 1e6;
    // Only shorten if it would be a whole number (no decimals)
    if (millions === Math.floor(millions)) {
      return `${millions}M`;
    }
    return n.toString();
  }

  // For billions (1B+)
  const billions = n / 1e9;
  // Only shorten if it would be a whole number (no decimals)
  if (billions === Math.floor(billions)) {
    return `${billions}G`;
  }
  return n.toString();
}
