import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../lib/format'
import type { LoanSchedule } from '../lib/types'

const C = { balance: '#1d4ed8', principal: '#0f766e', interest: '#d97706', payment: '#7c3aed', grid: '#e2e8f0' }

function compact(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e9) return `${+(v / 1e9).toFixed(2)} tỷ`
  if (a >= 1e6) return `${+(v / 1e6).toFixed(1)} tr`
  if (a >= 1e3) return `${+(v / 1e3).toFixed(0)} k`
  return String(v)
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="h-64 w-full sm:h-72">{children}</div>
    </div>
  )
}

export default function Charts({ schedule }: { schedule: LoanSchedule }) {
  const { rows, input, summary } = schedule
  const data = rows.map((r) => ({
    period: r.period,
    closing: r.closingBalance,
    principal: r.principal,
    interest: r.interestRounded,
    payment: r.paymentRounded,
  }))

  const markers = (
    <>
      {input.graceMonths > 0 && (
        <ReferenceLine
          x={input.graceMonths}
          stroke="#64748b"
          strokeDasharray="4 4"
          label={{ value: 'Hết ân hạn', position: 'insideTopRight', fill: '#475569', fontSize: 11 }}
        />
      )}
      {summary.floatingStartPeriod !== null && summary.floatingStartPeriod > 1 && (
        <ReferenceLine
          x={summary.floatingStartPeriod}
          stroke="#dc2626"
          strokeDasharray="4 4"
          label={{ value: 'Bắt đầu thả nổi', position: 'insideTopLeft', fill: '#b91c1c', fontSize: 11 }}
        />
      )}
    </>
  )

  const tip = (v: unknown) => `${formatNumber(Number(v))} ₫`
  const common = { data, margin: { top: 16, right: 12, left: 4, bottom: 0 } }
  const xAxis = <XAxis dataKey="period" tick={{ fontSize: 11 }} minTickGap={24} label={{ value: 'Kỳ (tháng)', position: 'insideBottomRight', offset: -2, fontSize: 11 }} />
  const yAxis = <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={64} />
  const tooltipProps = { formatter: tip, labelFormatter: (l: unknown) => `Kỳ ${l}` }

  return (
    <section aria-label="Biểu đồ" className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Biểu đồ</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Dư nợ cuối kỳ theo tháng (₫)">
          <ResponsiveContainer>
            <AreaChart {...common}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              {xAxis}
              {yAxis}
              <Tooltip {...tooltipProps} />
              <Area type="stepAfter" dataKey="closing" name="Dư nợ cuối kỳ" stroke={C.balance} fill={C.balance} fillOpacity={0.15} isAnimationActive={false} />
              {markers}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tổng thanh toán hàng tháng (₫)">
          <ResponsiveContainer>
            <LineChart {...common}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              {xAxis}
              {yAxis}
              <Tooltip {...tooltipProps} />
              <Line type="monotone" dataKey="payment" name="Tổng thanh toán" stroke={C.payment} dot={false} strokeWidth={2} isAnimationActive={false} />
              {markers}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Gốc và lãi phải trả hàng tháng (₫)">
        <ResponsiveContainer>
          <BarChart {...common}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            {xAxis}
            {yAxis}
            <Tooltip {...tooltipProps} />
            <Legend verticalAlign="top" height={24} />
            <Bar dataKey="principal" name="Gốc" stackId="a" fill={C.principal} isAnimationActive={false} />
            <Bar dataKey="interest" name="Lãi" stackId="a" fill={C.interest} isAnimationActive={false} />
            {markers}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  )
}
