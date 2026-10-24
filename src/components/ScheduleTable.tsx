import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatNumber, formatPercent } from '../lib/format'
import type { LoanSchedule } from '../lib/types'

type PhaseFilter = 'all' | 'grace' | 'principal' | 'promo' | 'floating'

const PAGE_SIZES = [12, 24, 60, 0] as const

const FILTER_LABELS: Record<PhaseFilter, string> = {
  all: 'Tất cả giai đoạn',
  grace: 'Giai đoạn ân hạn gốc',
  principal: 'Giai đoạn trả gốc',
  promo: 'Giai đoạn lãi ưu đãi',
  floating: 'Giai đoạn lãi thả nổi',
}

const th = 'whitespace-nowrap px-3 py-2 text-right font-semibold'
const td = 'num whitespace-nowrap px-3 py-1.5 text-right'

export default function ScheduleTable({ schedule }: { schedule: LoanSchedule }) {
  const { rows, summary } = schedule
  const N = rows.length
  const [pageSize, setPageSize] = useState<number>(12)
  const [page, setPage] = useState(1)
  const [phase, setPhase] = useState<PhaseFilter>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    const f = from.trim() === '' ? 1 : Math.max(1, Math.floor(Number(from)) || 1)
    const t = to.trim() === '' ? N : Math.min(N, Math.floor(Number(to)) || N)
    return rows.filter((r) => {
      if (r.period < f || r.period > t) return false
      switch (phase) {
        case 'grace':
          return r.isGrace
        case 'principal':
          return !r.isGrace
        case 'promo':
          return r.phase === 'promo'
        case 'floating':
          return r.phase === 'floating'
        default:
          return true
      }
    })
  }, [rows, N, phase, from, to])

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, totalPages)
  const visible = pageSize === 0 ? filtered : filtered.slice((current - 1) * pageSize, current * pageSize)

  const totals = useMemo(
    () =>
      filtered.reduce(
        (a, r) => ({ principal: a.principal + r.principal, interest: a.interest + r.interestRounded, payment: a.payment + r.paymentRounded }),
        { principal: 0, interest: 0, payment: 0 },
      ),
    [filtered],
  )
  const isWhole = filtered.length === N

  const inputCls = 'w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-200'
  const selectCls = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-200'
  const resetPage = () => setPage(1)

  return (
    <section aria-label="Bảng lịch trả nợ" className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Lịch trả nợ chi tiết</h2>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <label className="text-sm text-slate-600">
          <span className="mb-1 block text-xs font-medium">Giai đoạn</span>
          <select
            className={selectCls}
            value={phase}
            onChange={(e) => {
              setPhase(e.target.value as PhaseFilter)
              resetPage()
            }}
          >
            {(Object.keys(FILTER_LABELS) as PhaseFilter[]).map((k) => (
              <option key={k} value={k}>
                {FILTER_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block text-xs font-medium">Từ kỳ</span>
          <input
            className={inputCls}
            inputMode="numeric"
            placeholder="1"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value.replace(/\D/g, ''))
              resetPage()
            }}
          />
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block text-xs font-medium">Đến kỳ</span>
          <input
            className={inputCls}
            inputMode="numeric"
            placeholder={String(N)}
            value={to}
            onChange={(e) => {
              setTo(e.target.value.replace(/\D/g, ''))
              resetPage()
            }}
          />
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block text-xs font-medium">Số dòng / trang</span>
          <select
            className={selectCls}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              resetPage()
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'Toàn bộ kỳ' : n}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto text-sm text-slate-500">
          Hiển thị {formatNumber(filtered.length)} / {formatNumber(N)} kỳ
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className={th + ' text-center'}>Kỳ</th>
              <th className={th}>Dư nợ đầu kỳ (₫)</th>
              <th className={th}>Lãi suất (%/năm)</th>
              <th className={th}>Gốc phải trả (₫)</th>
              <th className={th}>Lãi phải trả (₫)</th>
              <th className={th}>Tổng thanh toán (₫)</th>
              <th className={th}>Dư nợ cuối kỳ (₫)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Không có kỳ nào khớp bộ lọc.
                </td>
              </tr>
            )}
            {visible.map((r) => (
              <tr key={r.period} className={r.isFloatingStart ? 'bg-red-50' : r.isGrace ? 'bg-amber-50' : undefined}>
                <td className="num whitespace-nowrap px-3 py-1.5 text-center">
                  <span className="font-medium">{r.period}</span>
                  {r.isGrace && (
                    <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">Ân hạn</span>
                  )}
                  {r.isFloatingStart && (
                    <span className="ml-2 rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-900">Bắt đầu thả nổi</span>
                  )}
                </td>
                <td className={td}>{formatNumber(r.openingBalance)}</td>
                <td className={td}>
                  {formatPercent(r.annualRate)}
                  <span className="ml-1 text-[10px] text-slate-400">{r.phase === 'promo' ? 'ƯĐ' : 'TN'}</span>
                </td>
                <td className={td}>{formatNumber(r.principal)}</td>
                <td className={td}>{formatNumber(r.interestRounded)}</td>
                <td className={td + ' font-medium'}>{formatNumber(r.paymentRounded)}</td>
                <td className={td}>{formatNumber(r.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-semibold text-slate-900">
            <tr>
              <td className="px-3 py-2 text-center">Tổng cộng{isWhole ? '' : ' (kỳ đã lọc)'}</td>
              <td className={td}>—</td>
              <td className={td}>—</td>
              <td className={td}>{formatNumber(totals.principal)}</td>
              <td className={td}>{formatNumber(totals.interest)}</td>
              <td className={td}>{formatNumber(totals.payment)}</td>
              <td className={td}>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        ƯĐ: lãi ưu đãi · TN: lãi thả nổi. Tổng cộng chỉ cộng các khoản đã thanh toán (gốc, lãi, tổng thanh toán); dư nợ đầu/cuối kỳ là số dư nên không cộng.
        {isWhole && summary.totalInterestRounded !== Math.round(summary.totalInterestExact) && (
          <> Tổng lãi chính xác chưa làm tròn từng kỳ: {formatNumber(summary.totalInterestExact)} ₫.</>
        )}
      </p>

      {pageSize !== 0 && totalPages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, current - 1))}
            disabled={current === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:text-slate-300"
          >
            <ChevronLeft size={16} /> Trước
          </button>
          <span className="num text-sm text-slate-600">
            Trang {current} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, current + 1))}
            disabled={current === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:text-slate-300"
          >
            Sau <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </section>
  )
}
