import { describe, expect, it } from 'vitest'
import { buildWorkbook } from './exportExcel'
import { calculateSchedule } from './loanCalculator'
import { validateLoanInput } from './validation'
import * as XLSX from 'xlsx'

describe('Xuất Excel', () => {
  const v = validateLoanInput({
    principal: 1_200_000_000,
    termMonths: 120,
    graceMonths: 12,
    promoRate: 6,
    promoYears: 2,
    floatingRate: 10,
  })
  if (!v.ok) throw new Error('invalid')
  const wb = buildWorkbook(calculateSchedule(v.value))

  it('có hai sheet đúng tên', () => {
    expect(wb.SheetNames).toEqual(['Tong_quan', 'Lich_tra_no'])
  })
  it('sheet lịch trả nợ đủ N kỳ + header + tổng cộng, ô tiền kiểu số', () => {
    const ws = wb.Sheets['Lich_tra_no']
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
    expect(rows).toHaveLength(1 + 120 + 1)
    for (const addr of ['B2', 'D14', 'E2', 'F2', 'G2']) {
      expect(ws[addr].t).toBe('n')
      expect(ws[addr].z).toBe('#,##0')
    }
    expect(ws['E2'].v).toBe(6_000_000)
  })
  it('sheet tổng quan có số liệu số', () => {
    const ws = wb.Sheets['Tong_quan']
    expect(ws['B4'].v).toBe(1_200_000_000)
    expect(ws['B4'].t).toBe('n')
  })
})
