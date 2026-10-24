import { formatMonths, formatNumber, formatPercent } from '../lib/format'
import type { LoanSchedule } from '../lib/types'

/** Bố cục chỉ hiển thị khi in (Ctrl+P / Lưu PDF): thông số khoản vay + toàn bộ lịch trả nợ. */
export default function PrintView({ schedule }: { schedule: LoanSchedule }) {
  const { input, rows, summary: s } = schedule
  const today = new Date().toLocaleDateString('vi-VN')

  const params: Array<[string, string]> = [
    ['Số tiền vay', `${formatNumber(input.principal)} ₫`],
    ['Thời hạn vay', formatMonths(input.termMonths)],
    ['Ân hạn gốc', formatMonths(input.graceMonths)],
    ['Lãi suất ưu đãi', `${formatPercent(input.promoRate)}/năm`],
    ['Thời gian ưu đãi', formatMonths(input.promoMonths)],
    ['Lãi suất thả nổi', `${formatPercent(input.floatingRate)}/năm`],
    ['Tổng gốc', `${formatNumber(s.totalPrincipal)} ₫`],
    ['Tổng lãi dự kiến', `${formatNumber(s.totalInterestExact)} ₫`],
    ['Tổng thanh toán', `${formatNumber(s.totalPaymentRounded)} ₫`],
    ['Thanh toán tháng đầu', `${formatNumber(s.firstPayment)} ₫`],
    ['Thanh toán cao nhất', `${formatNumber(s.maxPayment)} ₫ (kỳ ${s.maxPaymentPeriod})`],
    [
      'Kỳ bắt đầu lãi thả nổi',
      s.floatingStartPeriod === null ? 'Không áp dụng lãi suất thả nổi trong thời hạn vay' : `Kỳ ${s.floatingStartPeriod}`,
    ],
  ]

  const cell = 'border border-slate-400 px-2 py-0.5 text-right num'

  return (
    <div className="hidden text-[11px] text-black print:block">
      <header className="mb-3 border-b-2 border-slate-800 pb-2">
        <h1 className="text-xl font-bold">LOAN PLANNER — LỊCH TRẢ NỢ</h1>
        <p className="text-slate-600">Ngày lập: {today} · Đơn vị: VND · Gốc trả đều hàng tháng, lãi tính trên dư nợ đầu kỳ</p>
      </header>

      <table className="mb-4 w-full border-collapse">
        <tbody>
          {Array.from({ length: Math.ceil(params.length / 2) }, (_, i) => (
            <tr key={i}>
              {params.slice(i * 2, i * 2 + 2).map(([k, v]) => (
                <td key={k} className="border border-slate-300 px-2 py-1">
                  <span className="text-slate-600">{k}: </span>
                  <strong>{v}</strong>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead style={{ display: 'table-header-group' }}>
          <tr className="bg-slate-200">
            {['Kỳ', 'Dư nợ đầu kỳ', 'Lãi suất (%/năm)', 'Gốc phải trả', 'Lãi phải trả', 'Tổng thanh toán', 'Dư nợ cuối kỳ', 'Ghi chú'].map((h) => (
              <th key={h} className="border border-slate-400 px-2 py-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period} style={{ breakInside: 'avoid' }}>
              <td className="border border-slate-400 px-2 py-0.5 text-center">{r.period}</td>
              <td className={cell}>{formatNumber(r.openingBalance)}</td>
              <td className={cell}>{formatPercent(r.annualRate)}</td>
              <td className={cell}>{formatNumber(r.principal)}</td>
              <td className={cell}>{formatNumber(r.interestRounded)}</td>
              <td className={cell}>{formatNumber(r.paymentRounded)}</td>
              <td className={cell}>{formatNumber(r.closingBalance)}</td>
              <td className="border border-slate-400 px-2 py-0.5">
                {[r.isGrace ? 'Ân hạn' : '', r.isFloatingStart ? 'Bắt đầu thả nổi' : ''].filter(Boolean).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-200 font-bold">
            <td className="border border-slate-400 px-2 py-1 text-center">Tổng</td>
            <td className={cell}>—</td>
            <td className={cell}>—</td>
            <td className={cell}>{formatNumber(s.totalPrincipal)}</td>
            <td className={cell}>{formatNumber(s.totalInterestRounded)}</td>
            <td className={cell}>{formatNumber(s.totalPaymentRounded)}</td>
            <td className={cell}>—</td>
            <td className="border border-slate-400" />
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-slate-600">Kết quả mang tính tham khảo, không thay thế hợp đồng tín dụng của ngân hàng.</p>
    </div>
  )
}
