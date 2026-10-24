import { Landmark, TableProperties } from 'lucide-react'
import { useState } from 'react'
import Charts from './components/Charts'
import Dashboard from './components/Dashboard'
import InstallBanner from './components/InstallBanner'
import LoanForm, { type FormValues } from './components/LoanForm'
import PrintView from './components/PrintView'
import ScheduleTable from './components/ScheduleTable'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { exportScheduleToExcel } from './lib/exportExcel'
import { calculateSchedule } from './lib/loanCalculator'
import type { LoanField, LoanSchedule, ValidationErrors } from './lib/types'
import { validateLoanInput } from './lib/validation'

const INITIAL: FormValues = {
  principal: '1.200.000.000',
  termMonths: '120',
  graceMonths: '0',
  promoRate: '6',
  promoYears: '2',
  floatingRate: '10',
}

const EMPTY: FormValues = {
  principal: '',
  termMonths: '',
  graceMonths: '0',
  promoRate: '',
  promoYears: '',
  floatingRate: '',
}

export default function App() {
  const [values, setValues] = useState<FormValues>(INITIAL)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [schedule, setSchedule] = useState<LoanSchedule | null>(null)
  const { installPrompt, isInstalled, triggerInstall } = useInstallPrompt()

  const handleChange = (field: LoanField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e))
  }

  const handleSubmit = () => {
    const result = validateLoanInput(values)
    if (!result.ok) {
      setErrors(result.errors)
      setSchedule(null)
      return
    }
    setErrors({})
    setSchedule(calculateSchedule(result.value))
  }

  const handleReset = () => {
    setValues(EMPTY)
    setErrors({})
    setSchedule(null)
  }

  return (
    <>
      <div className="min-h-screen print:hidden">
        <InstallBanner
          onInstall={triggerInstall}
          isInstalled={isInstalled}
          hasPrompt={installPrompt !== null}
        />
        <header className="bg-blue-900 text-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
            <Landmark size={28} aria-hidden />
            <div>
              <h1 className="text-xl font-bold leading-tight">Loan Planner</h1>
              <p className="text-sm text-blue-200">Mô phỏng lịch trả nợ gốc và lãi hàng tháng — khoản vay ngân hàng</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <LoanForm
            values={values}
            errors={errors}
            canExport={schedule !== null}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
            onExport={() => schedule && exportScheduleToExcel(schedule)}
            onPrint={() => window.print()}
          />

          {Object.values(errors).some(Boolean) && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Dữ liệu chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu trước khi tính lịch trả nợ.
            </div>
          )}

          {schedule ? (
            <>
              <Dashboard schedule={schedule} />
              <Charts schedule={schedule} />
              <ScheduleTable schedule={schedule} />
            </>
          ) : (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
              <TableProperties size={36} className="mb-3 text-slate-400" aria-hidden />
              <p className="font-medium text-slate-700">Chưa có lịch trả nợ</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Nhập thông tin khoản vay rồi bấm “Tính lịch trả nợ” để xem tổng quan, biểu đồ và bảng chi tiết từng kỳ.
              </p>
            </div>
          )}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">
          Kết quả mang tính tham khảo. Gốc trả đều hàng tháng sau ân hạn; lãi = dư nợ đầu kỳ × lãi suất năm / 12, không lãi kép.
        </footer>
      </div>

      {schedule && <PrintView schedule={schedule} />}
    </>
  )
}
