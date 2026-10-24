import { Calculator, FileSpreadsheet, Printer, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatMoneyInput } from '../lib/format'
import { parseDecimal } from '../lib/validation'
import type { LoanField, ValidationErrors } from '../lib/types'

export type FormValues = Record<LoanField, string>

interface Props {
  values: FormValues
  errors: ValidationErrors
  canExport: boolean
  onChange: (field: LoanField, value: string) => void
  onSubmit: () => void
  onReset: () => void
  onExport: () => void
  onPrint: () => void
}

interface FieldProps {
  id: LoanField
  label: string
  unit: string
  hint?: ReactNode
  value: string
  error?: string
  inputMode?: 'numeric' | 'decimal'
  placeholder?: string
  onChange: (field: LoanField, value: string) => void
}

function Field({ id, label, unit, hint, value, error, inputMode = 'decimal', placeholder, onChange }: FieldProps) {
  const errId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div
        className={`flex overflow-hidden rounded-lg border bg-white focus-within:ring-2 ${
          error ? 'border-red-400 focus-within:ring-red-200' : 'border-slate-300 focus-within:ring-blue-200'
        }`}
      >
        <input
          id={id}
          name={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          onChange={(e) => onChange(id, e.target.value)}
          className="num min-w-0 flex-1 bg-transparent px-3 py-2 text-right outline-none"
        />
        <span className="select-none border-l border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">{unit}</span>
      </div>
      {error ? (
        <p id={errId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export default function LoanForm({ values, errors, canExport, onChange, onSubmit, onReset, onExport, onPrint }: Props) {
  const years = parseDecimal(values.promoYears)
  const promoHint =
    Number.isFinite(years) && years >= 0 && Math.abs(years * 12 - Math.round(years * 12)) < 1e-9
      ? `= ${Math.round(years * 12)} tháng ưu đãi`
      : 'Tự động quy đổi sang tháng (1 năm = 12 tháng).'

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Thông tin khoản vay</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          id="principal"
          label="Số tiền vay"
          unit="VND"
          inputMode="numeric"
          placeholder="1.200.000.000"
          value={values.principal}
          error={errors.principal}
          onChange={(f, v) => onChange(f, formatMoneyInput(v))}
        />
        <Field
          id="termMonths"
          label="Thời hạn vay"
          unit="tháng"
          inputMode="numeric"
          placeholder="120"
          value={values.termMonths}
          error={errors.termMonths}
          onChange={onChange}
        />
        <Field
          id="graceMonths"
          label="Thời gian ân hạn gốc"
          unit="tháng"
          inputMode="numeric"
          placeholder="0"
          hint="Chỉ trả lãi, chưa trả gốc."
          value={values.graceMonths}
          error={errors.graceMonths}
          onChange={onChange}
        />
        <Field
          id="promoRate"
          label="Lãi suất ưu đãi"
          unit="%/năm"
          placeholder="6"
          value={values.promoRate}
          error={errors.promoRate}
          onChange={onChange}
        />
        <Field
          id="promoYears"
          label="Số năm ưu đãi lãi suất"
          unit="năm"
          placeholder="2"
          hint={promoHint}
          value={values.promoYears}
          error={errors.promoYears}
          onChange={onChange}
        />
        <Field
          id="floatingRate"
          label="Lãi suất thả nổi"
          unit="%/năm"
          placeholder="10"
          hint="Áp dụng từ sau ưu đãi đến hết kỳ vay."
          value={values.floatingRate}
          error={errors.floatingRate}
          onChange={onChange}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <Calculator size={16} /> Tính lịch trả nợ
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={16} /> Làm mới
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
        >
          <FileSpreadsheet size={16} /> Xuất Excel
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={!canExport}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
        >
          <Printer size={16} /> In / lưu PDF
        </button>
      </div>
    </form>
  )
}
