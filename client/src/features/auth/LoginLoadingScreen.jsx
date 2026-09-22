import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const STEPS = [
  { label: 'Verifying credentials', duration: 600 },
  { label: 'Loading your workspace', duration: 700 },
  { label: 'Preparing dashboard', duration: 600 },
]

export default function LoginLoadingScreen({ onFinish, organizationName }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let timer
    let idx = 0

    function runStep() {
      if (idx < STEPS.length - 1) {
        timer = setTimeout(() => {
          idx += 1
          setStepIndex(idx)
          runStep()
        }, STEPS[idx].duration)
      } else {
        timer = setTimeout(() => {
          setDone(true)
          setTimeout(onFinish, 800)
        }, STEPS[idx].duration)
      }
    }

    runStep()
    return () => clearTimeout(timer)
  }, [onFinish])

  const progress = done ? 100 : Math.round((stepIndex / STEPS.length) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c2033]"
      aria-live="polite"
    >
      {/* ── Ambient background blobs ──────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#0d8c7a]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#55d6c1]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-white/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-white/[0.05]" />
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center gap-8 px-6 text-center max-w-xs">

        {/* Logo with animated rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer slow pulse ring */}
          <span
            className="absolute h-36 w-36 rounded-full border-2 border-[#0d8c7a]/20 animate-ping"
            style={{ animationDuration: '2.5s' }}
          />
          {/* Middle ring */}
          <span
            className="absolute h-28 w-28 rounded-full border border-[#55d6c1]/30 animate-ping"
            style={{ animationDuration: '1.8s', animationDelay: '0.3s' }}
          />
          {/* Logo circle */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-2 ring-white/20 shadow-2xl shadow-[#0d8c7a]/30">
            <img
              src="/logo.png"
              alt="CRMS Logo"
              className="h-16 w-16 object-contain drop-shadow-lg"
            />
          </div>
          {/* Done check overlay */}
          {done && (
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0d8c7a] ring-4 ring-[#0c2033] shadow-lg">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* App name + status */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#55d6c1] mb-2">
            College Room Management System
          </p>
          <h2 className="text-2xl font-bold text-white leading-tight">
            {done ? (
              <>
                Welcome,{' '}
                <span className="text-[#55d6c1]">{organizationName || 'Staff'}!</span>
              </>
            ) : (
              'Signing you in…'
            )}
          </h2>
          {done && (
            <p className="mt-1 text-sm text-white/50">Redirecting to your dashboard…</p>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex flex-col items-start gap-3 w-full min-w-[220px]">
          {STEPS.map((step, i) => {
            const isActive = i === stepIndex && !done
            const isDone = i < stepIndex || done

            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  !isDone && !isActive ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                    isDone
                      ? 'bg-[#0d8c7a] scale-100'
                      : isActive
                      ? 'bg-white/10 ring-2 ring-[#55d6c1] scale-110'
                      : 'bg-white/10 scale-90'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : isActive ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#55d6c1] animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-white/40" />
                  )}
                </span>
                <span
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    isDone ? 'text-[#55d6c1]' : isActive ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0d8c7a] to-[#55d6c1] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-[10px] text-white/30 tabular-nums">{progress}%</p>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-[10px] text-white/20 tracking-widest uppercase">
        CRMS · Faculty Portal
      </p>
    </div>
  )
}
