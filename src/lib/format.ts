const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const pf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 })

/** 1234567.4 → "1.234.567" (làm tròn đến đồng) */
export function formatNumber(n: number): string {
  return nf.format(Math.round(n))
}

/** 1234567 → "1.234.567 ₫" */
export function formatVND(n: number): string {
  return `${formatNumber(n)} ₫`
}

export function formatPercent(n: number): string {
  return `${pf.format(n)}%`
}

/** Định dạng chuỗi đang nhập thành số có dấu chấm ngăn cách hàng nghìn. */
export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (digits === '') return ''
  return nf.format(Number(digits))
}

export function formatMonths(months: number): string {
  if (months === 0) return '0 tháng'
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${months} tháng`
  return `${months} tháng (${y} năm${m ? ` ${m} tháng` : ''})`
}
