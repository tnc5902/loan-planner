import { Download, Smartphone, X } from 'lucide-react'
import { useState } from 'react'

interface InstallBannerProps {
  onInstall: () => void
  isInstalled: boolean
  hasPrompt: boolean
}

export default function InstallBanner({ onInstall, isInstalled, hasPrompt }: InstallBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [showAndroidGuide, setShowAndroidGuide] = useState(false)

  // Detect iOS
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches

  if (isInstalled || isInStandaloneMode || dismissed) return null

  const handleMainAction = () => {
    if (hasPrompt) {
      onInstall()
    } else if (isIOS) {
      setShowIOSGuide(true)
    } else {
      setShowAndroidGuide(true)
    }
  }

  return (
    <>
      {/* Main Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2044 100%)',
          borderBottom: '2px solid rgba(245,158,11,0.4)',
        }}
        className="relative px-4 py-3 print:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {/* Icon */}
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <Smartphone size={20} style={{ color: '#f59e0b' }} />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              📲 Cài ứng dụng về điện thoại — miễn phí!
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Dùng offline, truy cập nhanh từ màn hình chính, như app thật
            </p>
          </div>

          {/* Action button */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              id="pwa-install-btn"
              onClick={handleMainAction}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#f59e0b', color: '#0f2044' }}
            >
              <Download size={14} />
              {hasPrompt ? 'Cài ngay' : 'Hướng dẫn'}
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              aria-label="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center print:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl"
            style={{ background: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b p-5 pb-4">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: '#0f2044' }}>
                  🍎 Cài app trên iPhone / iPad
                </h2>
                <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-slate-500">Chỉ cần 3 bước đơn giản với Safari</p>
            </div>

            <ol className="space-y-4 p-5">
              {[
                {
                  step: '1',
                  title: 'Nhấn nút Chia sẻ  □↑',
                  desc: 'Ở thanh dưới Safari, nhấn biểu tượng chia sẻ (Share)',
                  emoji: '📤',
                },
                {
                  step: '2',
                  title: 'Chọn "Thêm vào màn hình chính"',
                  desc: 'Cuộn xuống trong menu và chọn "Add to Home Screen"',
                  emoji: '➕',
                },
                {
                  step: '3',
                  title: 'Nhấn "Thêm" để xác nhận',
                  desc: 'App xuất hiện ngay trên màn hình chính!',
                  emoji: '✅',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: '#1e3a5f' }}
                  >
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.emoji} {item.title}
                    </p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="px-5 pb-2">
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                💡 Phải dùng trình duyệt <strong>Safari</strong> trên iOS mới cài được.
              </p>
            </div>

            <div className="p-5 pt-3">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl py-3 font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f2044)' }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android / Desktop Guide Modal (when no native prompt yet) */}
      {showAndroidGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center print:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowAndroidGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl"
            style={{ background: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b p-5 pb-4">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: '#0f2044' }}>
                  🤖 Cài app trên Android
                </h2>
                <button onClick={() => setShowAndroidGuide(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-slate-500">Dùng Chrome trên Android để cài</p>
            </div>

            <ol className="space-y-4 p-5">
              {[
                {
                  step: '1',
                  title: 'Mở web bằng Chrome',
                  desc: 'Truy cập trang này trên trình duyệt Chrome',
                  emoji: '🌐',
                },
                {
                  step: '2',
                  title: 'Nhấn menu ⋮ (3 chấm)',
                  desc: 'Ở góc trên bên phải Chrome',
                  emoji: '⋮',
                },
                {
                  step: '3',
                  title: 'Chọn "Thêm vào màn hình chính"',
                  desc: 'Hoặc "Add to Home screen" / "Cài đặt ứng dụng"',
                  emoji: '📲',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: '#1e3a5f' }}
                  >
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.emoji} {item.title}
                    </p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="px-5 pb-2">
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                💡 Nếu thấy nút <strong>"Cài đặt ứng dụng"</strong> hiện tự động ở thanh dưới — nhấn vào đó là nhanh nhất!
              </p>
            </div>

            <div className="p-5 pt-3">
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="w-full rounded-xl py-3 font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f2044)' }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
