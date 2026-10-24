import * as XLSX from 'xlsx'
import type { LoanSchedule } from './types'

const MONEY_FMT = '#,##0'
const PCT_FMT = '0.00##'

type Cell = string | number | null

function setFormats(ws: XLSX.WorkSheet, fmt: (r: number, c: number) => string | undefined): void {
  const ref = ws['!ref']
  if (!ref) return
  const range = XLSX.utils.decode_range(ref)
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      const z = fmt(r, c)
      if (cell && cell.t === 'n' && z) cell.z = z
    }
  }
}

/** Xây workbook gồm 2 sheet: Tong_quan, Lich_tra_no. Các ô tiền là kiểu số. */
export function buildWorkbook(schedule: LoanSchedule): XLSX.WorkBook {
  const { input, rows, summary } = schedule

  const overview: Cell[][] = [
    ['LOAN PLANNER - LỊCH TRẢ NỢ', null],
    [],
    ['THÔNG SỐ ĐẦU VÀO', null],
    ['Số tiền vay (VND)', input.principal],
    ['Thời hạn vay (tháng)', input.termMonths],
    ['Ân hạn gốc (tháng)', input.graceMonths],
    ['Lãi suất ưu đãi (%/năm)', input.promoRate],
    ['Số năm ưu đãi', input.promoYears],
    ['Thời gian ưu đãi (tháng)', input.promoMonths],
    ['Lãi suất thả nổi (%/năm)', input.floatingRate],
    [],
    ['KẾT QUẢ (VND)', null],
    ['Tổng gốc phải trả', Math.round(summary.totalPrincipal)],
    ['Tổng lãi dự kiến (chính xác, làm tròn đồng)', Math.round(summary.totalInterestExact)],
    ['Tổng lãi theo các kỳ đã làm tròn', summary.totalInterestRounded],
    ['Tổng thanh toán toàn kỳ', summary.totalPaymentRounded],
    ['Khoản thanh toán tháng đầu tiên', summary.firstPayment],
    ['Khoản thanh toán cao nhất', summary.maxPayment],
    ['Kỳ có khoản thanh toán cao nhất', summary.maxPaymentPeriod],
    [
      'Kỳ đầu tiên áp dụng lãi suất thả nổi',
      summary.floatingStartPeriod ?? 'Không áp dụng lãi suất thả nổi trong thời hạn vay',
    ],
    [
      'Khoản thanh toán tháng đầu tiên lãi thả nổi',
      summary.firstFloatingPayment ?? 'Không áp dụng',
    ],
    ['Số kỳ trả gốc', summary.principalPeriods],
    ['Gốc trả mỗi tháng sau ân hạn', summary.regularPrincipal],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(overview)
  ws1['!cols'] = [{ wch: 48 }, { wch: 28 }]
  const moneyRows = new Set([3, 12, 13, 14, 15, 16, 17, 20, 22])
  setFormats(ws1, (r, c) => (c === 1 && moneyRows.has(r) ? MONEY_FMT : undefined))

  const header = [
    'Kỳ',
    'Dư nợ đầu kỳ (VND)',
    'Lãi suất áp dụng (%/năm)',
    'Gốc phải trả (VND)',
    'Lãi phải trả (VND)',
    'Tổng thanh toán (VND)',
    'Dư nợ cuối kỳ (VND)',
    'Ghi chú',
  ]
  const body: Cell[][] = rows.map((r) => [
    r.period,
    r.openingBalance,
    r.annualRate,
    r.principal,
    r.interestRounded,
    r.paymentRounded,
    r.closingBalance,
    [r.isGrace ? 'Ân hạn gốc' : '', r.isFloatingStart ? 'Bắt đầu lãi thả nổi' : ''].filter(Boolean).join('; '),
  ])
  const total: Cell[] = [
    'Tổng cộng',
    null,
    null,
    summary.totalPrincipal,
    summary.totalInterestRounded,
    summary.totalPaymentRounded,
    null,
    null,
  ]
  const ws2 = XLSX.utils.aoa_to_sheet([header, ...body, total])
  ws2['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 24 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 30 }]
  setFormats(ws2, (r, c) => {
    if (r === 0 || c === 0 || c === 7) return undefined
    return c === 2 ? PCT_FMT : MONEY_FMT
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws1, 'Tong_quan')
  XLSX.utils.book_append_sheet(wb, ws2, 'Lich_tra_no')
  return wb
}

export function exportScheduleToExcel(schedule: LoanSchedule, fileName = 'lich-tra-no.xlsx'): void {
  XLSX.writeFile(buildWorkbook(schedule), fileName)
}
