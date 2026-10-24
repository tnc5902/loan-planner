/** Dữ liệu thô người dùng nhập (chuỗi hoặc số). */
export interface RawLoanInput {
  principal: string | number
  termMonths: string | number
  graceMonths: string | number
  promoRate: string | number
  promoYears: string | number
  floatingRate: string | number
}

export type LoanField = keyof RawLoanInput

/** Dữ liệu đã được kiểm tra hợp lệ. */
export interface LoanInput {
  /** P: số tiền vay (VND) */
  principal: number
  /** N: thời hạn vay (tháng) */
  termMonths: number
  /** G: ân hạn gốc (tháng) */
  graceMonths: number
  /** r1: lãi suất ưu đãi (%/năm) */
  promoRate: number
  /** Số năm ưu đãi nhập vào */
  promoYears: number
  /** A: thời gian ưu đãi quy đổi (tháng) */
  promoMonths: number
  /** r2: lãi suất thả nổi (%/năm) */
  floatingRate: number
}

export type ValidationErrors = Partial<Record<LoanField, string>>

export type ValidationResult =
  | { ok: true; value: LoanInput }
  | { ok: false; errors: ValidationErrors }

export type RatePhase = 'promo' | 'floating'

export interface ScheduleRow {
  period: number
  openingBalance: number
  /** Lãi suất áp dụng (%/năm) */
  annualRate: number
  phase: RatePhase
  isGrace: boolean
  /** Kỳ đầu tiên áp dụng lãi suất thả nổi */
  isFloatingStart: boolean
  principal: number
  /** Lãi chính xác (không làm tròn) */
  interest: number
  /** Lãi làm tròn đến đồng, dùng để hiển thị */
  interestRounded: number
  /** Gốc + lãi chính xác */
  payment: number
  /** Gốc + lãi đã làm tròn, dùng để hiển thị */
  paymentRounded: number
  closingBalance: number
}

export interface ScheduleSummary {
  totalPrincipal: number
  /** Tổng lãi chính xác nội bộ (chưa làm tròn từng kỳ) */
  totalInterestExact: number
  /** Tổng các khoản lãi đã làm tròn từng kỳ (khớp bảng hiển thị) */
  totalInterestRounded: number
  totalPaymentExact: number
  totalPaymentRounded: number
  /** K = N - G */
  principalPeriods: number
  /** Gốc trả đều mỗi kỳ (kỳ thông thường) */
  regularPrincipal: number
  firstPayment: number
  maxPayment: number
  maxPaymentPeriod: number
  /** Kỳ đầu tiên áp dụng lãi thả nổi (null nếu ưu đãi toàn kỳ) */
  floatingStartPeriod: number | null
  firstFloatingPayment: number | null
}

export interface LoanSchedule {
  input: LoanInput
  rows: ScheduleRow[]
  summary: ScheduleSummary
}
