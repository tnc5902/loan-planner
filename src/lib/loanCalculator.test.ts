import { describe, expect, it } from 'vitest'
import { calculateSchedule } from './loanCalculator'
import { validateLoanInput } from './validation'
import type { LoanInput, RawLoanInput } from './types'
import { formatMoneyInput, formatNumber } from './format'

interface Params {
  P?: number
  N?: number
  G?: number
  r1?: number
  years?: number
  r2?: number
}

function raw({ P = 1_200_000_000, N = 120, G = 0, r1 = 6, years = 2, r2 = 10 }: Params = {}): RawLoanInput {
  return { principal: P, termMonths: N, graceMonths: G, promoRate: r1, promoYears: years, floatingRate: r2 }
}

function build(p: Params = {}): ReturnType<typeof calculateSchedule> {
  const v = validateLoanInput(raw(p))
  if (!v.ok) throw new Error('input không hợp lệ: ' + JSON.stringify(v.errors))
  return calculateSchedule(v.value)
}

describe('Test 1 — Khoản vay cơ bản', () => {
  const s = build()
  it('gốc, lãi kỳ 1, lãi suất kỳ 25', () => {
    expect(s.rows).toHaveLength(120)
    expect(s.rows[0].principal).toBe(10_000_000)
    expect(s.rows[0].interest).toBeCloseTo(6_000_000, 6)
    expect(s.rows[23].annualRate).toBe(6)
    expect(s.rows[24].annualRate).toBe(10)
    expect(s.rows[24].isFloatingStart).toBe(true)
    expect(s.summary.floatingStartPeriod).toBe(25)
  })
  it('tổng gốc và dư nợ cuối', () => {
    expect(s.summary.totalPrincipal).toBe(1_200_000_000)
    expect(s.rows[119].closingBalance).toBe(0)
  })
  it('lãi kỳ 25 tính trên dư nợ đầu kỳ', () => {
    // dư nợ đầu kỳ 25 = 1.2 tỷ - 24 * 10tr = 960tr; 960tr * 10%/12
    expect(s.rows[24].openingBalance).toBe(960_000_000)
    expect(s.rows[24].interest).toBeCloseTo((960_000_000 * 0.1) / 12, 4)
  })
})

describe('Test 2 — Ân hạn 12 tháng', () => {
  const s = build({ G: 12 })
  it('12 kỳ đầu chỉ trả lãi, dư nợ không đổi', () => {
    for (let i = 0; i < 12; i++) {
      expect(s.rows[i].principal).toBe(0)
      expect(s.rows[i].isGrace).toBe(true)
      expect(s.rows[i].closingBalance).toBe(1_200_000_000)
    }
    expect(s.rows[0].interest).toBeCloseTo(6_000_000, 6)
  })
  it('gốc kỳ 13 trả đều trong 108 kỳ', () => {
    expect(s.rows[12].principal).toBe(Math.round(1_200_000_000 / 108))
    expect(s.rows.filter((r) => r.principal > 0)).toHaveLength(108)
    expect(s.summary.principalPeriods).toBe(108)
  })
  it('kỳ 25 chuyển sang 10%, tổng gốc đúng, dư nợ cuối 0', () => {
    expect(s.rows[23].annualRate).toBe(6)
    expect(s.rows[24].annualRate).toBe(10)
    expect(s.summary.totalPrincipal).toBe(1_200_000_000)
    expect(s.rows[119].closingBalance).toBe(0)
  })
})

describe('Test 3 — Không có thời gian ưu đãi (A = 0)', () => {
  const s = build({ years: 0 })
  it('kỳ 1 áp dụng lãi thả nổi', () => {
    expect(s.rows[0].annualRate).toBe(10)
    expect(s.rows[0].phase).toBe('floating')
    expect(s.rows[0].isFloatingStart).toBe(true)
    expect(s.summary.floatingStartPeriod).toBe(1)
    expect(s.rows.every((r) => r.annualRate === 10)).toBe(true)
  })
})

describe('Test 4 — Ưu đãi toàn kỳ (A = N)', () => {
  const s = build({ years: 10 })
  it('mọi kỳ dùng lãi ưu đãi, không có kỳ thả nổi', () => {
    expect(s.rows.every((r) => r.annualRate === 6 && r.phase === 'promo')).toBe(true)
    expect(s.summary.floatingStartPeriod).toBeNull()
    expect(s.summary.firstFloatingPayment).toBeNull()
    expect(s.rows.some((r) => r.isFloatingStart)).toBe(false)
  })
})

describe('Test 5 — Không có kỳ trả gốc (G >= N)', () => {
  it.each([120, 130])('G = %i bị từ chối', (G) => {
    const v = validateLoanInput(raw({ G }))
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.errors.graceMonths).toMatch(/nhỏ hơn thời hạn/)
  })
})

describe('Test 6 — Input không hợp lệ', () => {
  const cases: Array<[string, Params | RawLoanInput, string]> = [
    ['vay = 0', { P: 0 }, 'principal'],
    ['vay âm', { P: -5 }, 'principal'],
    ['vay để trống', { ...raw(), principal: '' } as RawLoanInput, 'principal'],
    ['thời hạn = 0', { N: 0 }, 'termMonths'],
    ['thời hạn thập phân', { N: 12.5 }, 'termMonths'],
    ['thời hạn âm', { N: -12 }, 'termMonths'],
    ['ân hạn âm', { G: -1 }, 'graceMonths'],
    ['ân hạn thập phân', { G: 1.5 }, 'graceMonths'],
    ['lãi ưu đãi âm', { r1: -1 }, 'promoRate'],
    ['lãi thả nổi âm', { r2: -0.1 }, 'floatingRate'],
    ['số năm ưu đãi âm', { years: -1 }, 'promoYears'],
    ['số năm ưu đãi không quy đổi nguyên', { years: 0.1 }, 'promoYears'],
    ['ưu đãi vượt thời hạn', { N: 24, years: 3 }, 'promoYears'],
    ['không phải số', { ...raw(), promoRate: 'abc' } as RawLoanInput, 'promoRate'],
  ]
  it.each(cases)('%s → từ chối', (_name, input, field) => {
    const v = validateLoanInput('principal' in input ? (input as RawLoanInput) : raw(input as Params))
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.errors[field as keyof RawLoanInput]).toBeTruthy()
  })
  it('chấp nhận số năm thập phân quy đổi nguyên và chuỗi kiểu Việt Nam', () => {
    const v = validateLoanInput({
      principal: '1.200.000.000',
      termMonths: '120',
      graceMonths: '',
      promoRate: '6,5',
      promoYears: '1,5',
      floatingRate: '10',
    })
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.value.principal).toBe(1_200_000_000)
      expect(v.value.promoMonths).toBe(18)
      expect(v.value.promoRate).toBe(6.5)
      expect(v.value.graceMonths).toBe(0)
    }
  })
})

describe('Test 7 — Gốc không chia hết', () => {
  const P = 1_000_000_000 // 1e9 / 7 không chia hết
  const s = build({ P, N: 7, G: 0, years: 0 })
  it('tổng gốc bằng đúng số tiền vay, kỳ cuối bù chênh lệch', () => {
    expect(s.summary.totalPrincipal).toBe(P)
    expect(s.rows[6].closingBalance).toBe(0)
    expect(s.rows[6].principal).toBe(s.rows[6].openingBalance)
    expect(s.rows[6].principal).not.toBe(s.rows[0].principal)
    expect(Number.isInteger(s.rows[0].principal)).toBe(true)
  })
  it('kỳ cuối không bao giờ âm kể cả khi làm tròn lên (P=11, K=7)', () => {
    const t = build({ P: 11, N: 7, years: 0 })
    expect(t.rows.every((r) => r.principal >= 0 && r.closingBalance >= 0)).toBe(true)
    expect(t.summary.totalPrincipal).toBe(11)
  })
})

describe('Test 8 — Ân hạn dài hơn ưu đãi', () => {
  const s = build({ G: 36, years: 2 })
  it('gốc = 0 suốt ân hạn, lãi chuyển thả nổi đúng kỳ 25', () => {
    for (let i = 0; i < 36; i++) expect(s.rows[i].principal).toBe(0)
    expect(s.rows[23].annualRate).toBe(6)
    expect(s.rows[24].annualRate).toBe(10)
    expect(s.rows[24].isGrace).toBe(true)
    expect(s.rows[24].interest).toBeCloseTo(10_000_000, 6)
  })
  it('lãi không cộng vào dư nợ gốc', () => {
    for (let i = 0; i < 36; i++) {
      expect(s.rows[i].openingBalance).toBe(1_200_000_000)
      expect(s.rows[i].closingBalance).toBe(1_200_000_000)
    }
    expect(s.rows[36].principal).toBeGreaterThan(0)
  })
})

describe('Test 9 — Ưu đãi dài hơn ân hạn', () => {
  const s = build({ G: 12, years: 3 })
  it('bắt đầu trả gốc kỳ 13 vẫn với lãi ưu đãi đến hết kỳ 36', () => {
    expect(s.rows[11].principal).toBe(0)
    expect(s.rows[12].principal).toBeGreaterThan(0)
    expect(s.rows[12].annualRate).toBe(6)
    expect(s.rows[35].annualRate).toBe(6)
    expect(s.rows[36].annualRate).toBe(10)
    expect(s.summary.floatingStartPeriod).toBe(37)
  })
})

describe('Test 10 — Lãi ưu đãi bằng lãi thả nổi', () => {
  const same = build({ r1: 8, r2: 8 })
  it('vẫn xác định kỳ chuyển đổi nhưng lãi không đổi', () => {
    expect(same.summary.floatingStartPeriod).toBe(25)
    expect(same.rows[24].isFloatingStart).toBe(true)
    expect(same.rows[23].phase).toBe('promo')
    expect(same.rows[24].phase).toBe('floating')
    const rate = 8 / 100 / 12
    for (const r of same.rows) expect(r.interest).toBeCloseTo(r.openingBalance * rate, 6)
  })
  it('lãi giống hệt lịch không có ưu đãi cùng mức lãi', () => {
    const none = build({ r1: 8, r2: 8, years: 0 })
    same.rows.forEach((r, i) => expect(r.interest).toBe(none.rows[i].interest))
  })
})

describe('Test 11 — Ân hạn bằng 0', () => {
  const s = build({ G: 0 })
  it('kỳ 1 trả gốc, không có kỳ ân hạn', () => {
    expect(s.rows[0].principal).toBe(10_000_000)
    expect(s.rows.some((r) => r.isGrace)).toBe(false)
  })
})

describe('Test 12 — Độ chính xác', () => {
  const scenarios: Params[] = [
    {},
    { G: 12 },
    { P: 987_654_321, N: 97, G: 5, r1: 7.35, years: 1.5, r2: 11.2 },
    { P: 3_333_333_333, N: 360, G: 24, r1: 5.9, years: 3, r2: 9.85 },
    { P: 1, N: 3, years: 0 },
    { P: 500_000_000, N: 60, G: 59, years: 0.5 },
  ]
  it.each(scenarios.map((p, i) => [i, p] as const))('kịch bản %i', (_i, p) => {
    const s = build(p)
    const N = s.input.termMonths
    expect(s.rows).toHaveLength(N)
    expect(s.rows.every((r) => r.closingBalance >= 0 && r.openingBalance >= 0)).toBe(true)
    expect(s.summary.totalPrincipal).toBe(s.input.principal)
    expect(s.rows[N - 1].closingBalance).toBe(0)

    // dư nợ đầu kỳ = dư nợ cuối kỳ trước
    for (let i = 1; i < N; i++) expect(s.rows[i].openingBalance).toBe(s.rows[i - 1].closingBalance)

    // tổng lãi khớp công thức độc lập (lãi trên dư nợ đầu kỳ, không lãi kép)
    let expected = 0
    s.rows.forEach((r) => {
      const rate = (r.period <= s.input.promoMonths ? s.input.promoRate : s.input.floatingRate) / 100 / 12
      expected += r.openingBalance * rate
    })
    expect(s.summary.totalInterestExact).toBeCloseTo(expected, 3)

    // tổng lãi làm tròn = tổng các kỳ đã làm tròn, chênh lệch nhỏ so với chính xác
    const sumRounded = s.rows.reduce((a, r) => a + Math.round(r.interest), 0)
    expect(s.summary.totalInterestRounded).toBe(sumRounded)
    expect(Math.abs(s.summary.totalInterestRounded - s.summary.totalInterestExact)).toBeLessThanOrEqual(N / 2)

    // tổng thanh toán = gốc + lãi
    expect(s.summary.totalPaymentRounded).toBe(s.summary.totalPrincipal + s.summary.totalInterestRounded)
  })
})

describe('Dashboard / tiện ích', () => {
  it('chỉ số tổng quan lấy từ kết quả thực', () => {
    const s = build({ G: 12 })
    expect(s.summary.firstPayment).toBe(6_000_000)
    expect(s.summary.firstFloatingPayment).toBe(s.rows[24].paymentRounded)
    expect(s.rows[s.summary.maxPaymentPeriod - 1].paymentRounded).toBe(s.summary.maxPayment)
  })
  it('định dạng số kiểu Việt Nam', () => {
    expect(formatNumber(1234567.4)).toBe('1.234.567')
    expect(formatMoneyInput('1200000000')).toBe('1.200.000.000')
    expect(formatMoneyInput('abc')).toBe('')
  })
  it('kiểu LoanInput đầy đủ', () => {
    const i: LoanInput = { principal: 1, termMonths: 1, graceMonths: 0, promoRate: 0, promoYears: 0, promoMonths: 0, floatingRate: 0 }
    expect(calculateSchedule(i).rows[0].closingBalance).toBe(0)
  })
})
