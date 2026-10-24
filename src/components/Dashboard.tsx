import type { ReactNode } from 'react'
import { formatMonths, formatNumber, formatPercent, formatVND } from '../lib/format'
import type { LoanSchedule } from '../lib/types'

function Card({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'accent' }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === 'accent' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="num mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

export default function Dashboard({ schedule }: { schedule: LoanSchedule }) {
  const { input, summary: s } = schedule
  const diff = s.totalInterestRounded - Math.round(s.totalInterestExact)

  return (
    <section aria-label="Tổng quan khoản vay" className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Tổng quan</h2>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Số tiền vay" value={formatVND(input.principal)} />
        <Card label="Thời hạn vay" value={formatMonths(input.termMonths)} />
        <Card label="Ân hạn gốc" value={formatMonths(input.graceMonths)} />
        <Card
          label="Thời gian ưu đãi"
          value={formatMonths(input.promoMonths)}
          sub={`Lãi ưu đãi ${formatPercent(input.promoRate)}/năm · thả nổi ${formatPercent(input.floatingRate)}/năm`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card label="Tổng gốc phải trả" value={formatVND(s.totalPrincipal)} />
        <Card
          label="Tổng lãi dự kiến"
          tone="accent"
          value={formatVND(s.totalInterestExact)}
          sub={
            <>
              Tổng các kỳ đã làm tròn: {formatVND(s.totalInterestRounded)}
              {diff !== 0 && ` (lệch ${diff > 0 ? '+' : ''}${formatNumber(diff)} ₫ do làm tròn từng kỳ)`}
            </>
          }
        />
        <Card label="Tổng thanh toán toàn kỳ" tone="accent" value={formatVND(s.totalPaymentRounded)} sub="Gốc + lãi (không gồm dư nợ)" />
        <Card label="Thanh toán tháng đầu tiên" value={formatVND(s.firstPayment)} />
        <Card label="Thanh toán cao nhất" value={formatVND(s.maxPayment)} sub={`Kỳ ${s.maxPaymentPeriod}`} />
        <Card
          label="Thanh toán tháng đầu lãi thả nổi"
          value={s.firstFloatingPayment === null ? 'Không áp dụng' : formatVND(s.firstFloatingPayment)}
          sub={
            s.floatingStartPeriod === null
              ? 'Không áp dụng lãi suất thả nổi trong thời hạn vay'
              : `Kỳ ${s.floatingStartPeriod}${input.floatingRate === input.promoRate ? ' (lãi suất không đổi so với ưu đãi)' : ''}`
          }
        />
        <Card
          label="Gốc trả mỗi tháng sau ân hạn"
          value={formatVND(s.regularPrincipal)}
          sub={`${s.principalPeriods} kỳ trả gốc; kỳ cuối điều chỉnh để tổng gốc khớp số tiền vay`}
        />
      </div>
    </section>
  )
}
