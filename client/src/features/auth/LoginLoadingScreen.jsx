import { useEffect, useState } from 'react'
import { Building2, CheckCircle2 } from 'lucide-react'

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
        // Last step – show complete state then call onFinish
        timer = setTimeout(() => {
          setDone(true)
          setTimeout(onFinish, 600)
        }, STEPS[idx].duration)
      }
    }

    runStep()
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#12354a]" aria-live="polite">
      {/* Background decorative circles */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full border-[48px] border-white/5" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full border-[32px] border-[#55d6c1]/10" />

      <div className="relative flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo + pulse ring */}
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-[#0d8c7a]/20 animate-ping" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <img src="/logo.png" alt="CRMS Logo" className="h-14 w-14 object-contain" />
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#55d6c1]">College Room Management System</p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {done ? `Welcome, ${organizationName || 'Staff'}!` : 'Signing you in…'}
          </h2>
        </div>

        {/* Step indicators */}
        <div className="flex flex-col items-start gap-3 min-w-[220px]">
          {STEPS.map((step, i) => {
            const isActive = i === stepIndex && !done
            const isDone = i < stepIndex || done

            return (
              <div key={step.label} className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-[#0d8c7a]'
                      : isActive
                      ? 'bg-white/20 ring-2 ring-[#55d6c1]'
                      : 'bg-white/10'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  ) : isActive ? (
                    <span className="h-2 w-2 rounded-full bg-[#55d6c1] animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-white/30" />
                  )}
                </span>
                <span
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    isDone ? 'text-[#55d6c1]' : isActive ? 'text-white' : 'text-white/30'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-56 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0d8c7a] to-[#55d6c1] transition-all duration-500"
            style={{ width: done ? '100%' : `${((stepIndex) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <p className="absolute bottom-8 text-xs text-white/30">Powered by CRMS · Campus Living</p>
    </div>
  )
}
