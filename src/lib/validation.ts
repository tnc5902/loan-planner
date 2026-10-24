import type { LoanField, LoanInput, RawLoanInput, ValidationErrors, ValidationResult } from './types'

/**
 * Chuyển chuỗi nhập thành số. Chấp nhận dấu phẩy hoặc chấm làm thập phân
 * và bỏ khoảng trắng. Trả NaN nếu không phải số.
 */
export function parseDecimal(raw: string | number): number {
  if (typeof raw === 'number') return raw
  const s = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (s === '' || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN
  return Number(s)
}

/** Số tiền: bỏ mọi dấu phân cách hàng nghìn (chấm, phẩy, khoảng trắng). */
export function parseMoney(raw: string | number): number {
  if (typeof raw === 'number') return raw
  const s = raw.trim().replace(/[\s.,]/g, '')
  if (s === '' || !/^-?\d+$/.test(s)) return NaN
  return Number(s)
}

const EPS = 1e-9
const isBlank = (v: string | number) => typeof v === 'string' && v.trim() === ''

export function validateLoanInput(raw: RawLoanInput): ValidationResult {
  const errors: ValidationErrors = {}
  const fail = (f: LoanField, msg: string) => {
    if (!errors[f]) errors[f] = msg
  }

  // Số tiền vay
  const principal = parseMoney(raw.principal)
  if (isBlank(raw.principal)) fail('principal', 'Vui lòng nhập số tiền vay.')
  else if (!Number.isFinite(principal)) fail('principal', 'Số tiền vay không hợp lệ.')
  else if (principal <= 0) fail('principal', 'Số tiền vay phải lớn hơn 0.')
  else if (!Number.isSafeInteger(principal)) fail('principal', 'Số tiền vay quá lớn.')

  // Thời hạn
  const term = parseDecimal(raw.termMonths)
  if (isBlank(raw.termMonths)) fail('termMonths', 'Vui lòng nhập thời hạn vay.')
  else if (!Number.isFinite(term) || !Number.isInteger(term) || term <= 0)
    fail('termMonths', 'Thời hạn vay phải là số nguyên dương (tháng).')
  else if (term > 1200) fail('termMonths', 'Thời hạn vay tối đa 1.200 tháng.')

  // Ân hạn
  const grace = isBlank(raw.graceMonths) ? 0 : parseDecimal(raw.graceMonths)
  if (!Number.isFinite(grace) || !Number.isInteger(grace) || grace < 0)
    fail('graceMonths', 'Ân hạn gốc phải là số nguyên không âm (tháng).')
  else if (Number.isInteger(term) && term > 0 && grace >= term)
    fail('graceMonths', 'Ân hạn gốc phải nhỏ hơn thời hạn vay để có kỳ trả gốc.')

  // Lãi suất
  const promoRate = parseDecimal(raw.promoRate)
  if (isBlank(raw.promoRate)) fail('promoRate', 'Vui lòng nhập lãi suất ưu đãi.')
  else if (!Number.isFinite(promoRate) || promoRate < 0)
    fail('promoRate', 'Lãi suất ưu đãi phải là số không âm.')

  const floatingRate = parseDecimal(raw.floatingRate)
  if (isBlank(raw.floatingRate)) fail('floatingRate', 'Vui lòng nhập lãi suất thả nổi.')
  else if (!Number.isFinite(floatingRate) || floatingRate < 0)
    fail('floatingRate', 'Lãi suất thả nổi phải là số không âm.')

  // Số năm ưu đãi
  const promoYears = parseDecimal(raw.promoYears)
  let promoMonths = NaN
  if (isBlank(raw.promoYears)) fail('promoYears', 'Vui lòng nhập số năm ưu đãi (nhập 0 nếu không có).')
  else if (!Number.isFinite(promoYears) || promoYears < 0)
    fail('promoYears', 'Số năm ưu đãi phải là số không âm.')
  else {
    const m = promoYears * 12
    const rounded = Math.round(m)
    if (Math.abs(m - rounded) > EPS)
      fail('promoYears', 'Số năm ưu đãi phải quy đổi được thành số tháng nguyên (ví dụ 1,5 năm = 18 tháng).')
    else {
      promoMonths = rounded
      if (Number.isInteger(term) && term > 0 && promoMonths > term)
        fail('promoYears', 'Thời gian ưu đãi không được vượt quá thời hạn vay.')
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const value: LoanInput = {
    principal,
    termMonths: term,
    graceMonths: grace,
    promoRate,
    promoYears,
    promoMonths,
    floatingRate,
  }
  return { ok: true, value }
}
