import type { LoanInput, LoanSchedule, ScheduleRow } from './types'

/**
 * Gốc kỳ thông thường: P / K làm tròn đến đồng (thực tế ngân hàng thu số nguyên đồng).
 * Phần chênh lệch dồn vào kỳ cuối. Nếu làm tròn khiến kỳ cuối âm thì dùng làm tròn xuống.
 */
export function regularPrincipalPerPeriod(principal: number, periods: number): number {
  const rounded = Math.round(principal / periods)
  if (principal - rounded * (periods - 1) >= 0) return rounded
  return Math.floor(principal / periods)
}

/**
 * Tính lịch trả nợ. Hàm thuần, không phụ thuộc React/DOM.
 * Giả định input đã được validate (xem validateLoanInput).
 *
 * Quy ước làm tròn:
 *  - Lãi mỗi kỳ giữ độ chính xác đầy đủ (interest); interestRounded chỉ dùng để hiển thị.
 *  - Gốc mỗi kỳ thông thường là số nguyên đồng; gốc kỳ cuối = dư nợ đầu kỳ cuối
 *    nên tổng gốc đúng bằng số tiền vay và dư nợ cuối cùng bằng 0.
 */
export function calculateSchedule(input: LoanInput): LoanSchedule {
  const { principal: P, termMonths: N, graceMonths: G, promoMonths: A, promoRate, floatingRate } = input
  const K = N - G
  const regular = regularPrincipalPerPeriod(P, K)

  const rows: ScheduleRow[] = []
  let balance = P

  for (let t = 1; t <= N; t++) {
    const opening = balance
    const isPromo = t <= A
    const annualRate = isPromo ? promoRate : floatingRate
    const monthlyRate = annualRate / 100 / 12
    const isGrace = t <= G

    let principalPaid = 0
    if (!isGrace) principalPaid = t === N ? opening : Math.min(regular, opening)

    const interest = opening * monthlyRate
    const interestRounded = Math.round(interest)
    const closing = t === N ? 0 : Math.max(0, opening - principalPaid)

    rows.push({
      period: t,
      openingBalance: opening,
      annualRate,
      phase: isPromo ? 'promo' : 'floating',
      isGrace,
      isFloatingStart: t === A + 1,
      principal: principalPaid,
      interest,
      interestRounded,
      payment: principalPaid + interest,
      paymentRounded: principalPaid + interestRounded,
      closingBalance: closing,
    })
    balance = closing
  }

  let totalPrincipal = 0
  let totalInterestExact = 0
  let totalInterestRounded = 0
  let totalPaymentExact = 0
  let totalPaymentRounded = 0
  let maxRow = rows[0]
  for (const r of rows) {
    totalPrincipal += r.principal
    totalInterestExact += r.interest
    totalInterestRounded += r.interestRounded
    totalPaymentExact += r.payment
    totalPaymentRounded += r.paymentRounded
    if (r.paymentRounded > maxRow.paymentRounded) maxRow = r
  }

  const floatingRow = A < N ? rows[A] : undefined

  return {
    input,
    rows,
    summary: {
      totalPrincipal,
      totalInterestExact,
      totalInterestRounded,
      totalPaymentExact,
      totalPaymentRounded,
      principalPeriods: K,
      regularPrincipal: regular,
      firstPayment: rows[0].paymentRounded,
      maxPayment: maxRow.paymentRounded,
      maxPaymentPeriod: maxRow.period,
      floatingStartPeriod: floatingRow ? floatingRow.period : null,
      firstFloatingPayment: floatingRow ? floatingRow.paymentRounded : null,
    },
  }
}
