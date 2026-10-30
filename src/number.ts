const intlSats = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const intlShortSats = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const units = [
  { size: 1e3, suffix: "K" },
  { size: 1e6, suffix: "M" },
  { size: 1e9, suffix: "G" },
]

export function formatShort(fmt: Intl.NumberFormat, n: number) {
  if (n < 2e3) {
    return fmt.format(n)
  }
  let index = n < 1e6 ? 0 : n < 1e9 ? 1 : 2
  let scaled = fmt.format(n / units[index].size)
  while (index < units.length - 1 && Number(scaled.replace(/[^0-9.]/g, "")) >= 1000) {
    index++
    scaled = fmt.format(n / units[index].size)
  }
  return `${scaled}${units[index].suffix}`
}

export function usdToSats(usd: number, btcUsdAsk: number) {
  if (!Number.isFinite(usd) || !Number.isFinite(btcUsdAsk) || btcUsdAsk <= 0) return 0
  return Math.round((usd / btcUsdAsk) * 1e8)
}

export function formatSats(n: number) {
  return formatShort(intlSats, n)
}

export function formatSatsCompact(n: number) {
  return formatShort(intlShortSats, n)
}

export function formatZapAmount(n: number) {
  // For numbers less than 2000, always show full amount
  if (n < 2e3) {
    return n.toString()
  }

  // For thousands (2000+)
  if (n < 1e6) {
    const thousands = n / 1e3
    // Only shorten if it would be a whole number (no decimals)
    if (thousands === Math.floor(thousands)) {
      return `${thousands}K`
    }
    return n.toString()
  }

  // For millions (1M+)
  if (n < 1e9) {
    const millions = n / 1e6
    // Only shorten if it would be a whole number (no decimals)
    if (millions === Math.floor(millions)) {
      return `${millions}M`
    }
    return n.toString()
  }

  // For billions (1B+)
  const billions = n / 1e9
  // Only shorten if it would be a whole number (no decimals)
  if (billions === Math.floor(billions)) {
    return `${billions}G`
  }
  return n.toString()
}
