import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Share2,
  Smartphone,
  Sparkles,
  X
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'

export default function Login({ onRegister, onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Download & Install App modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [deviceTab, setDeviceTab] = useState('android') // 'android' | 'ios' | 'pc'

  // Capture PWA install prompt if supported by browser
  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to sign in.')
      onLogin(data.staff)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy mobile app URL
  function handleCopyAppLink() {
    const portalUrl = `${window.location.origin}/login`
    navigator.clipboard?.writeText(portalUrl).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    })
  }

  function downloadCrmsApk() {
    window.location.assign('https://github.com/jaycomendador/crms/releases/download/CRMS/CRMS.apk')
  }

  // Trigger download of the React Native source project zip file
  function downloadFacultySourceZip() {
    const zipUrl = '/downloads/CRMS-Faculty-App-Source.zip'
    const a = document.createElement('a')
    a.href = zipUrl
    a.download = 'CRMS-Faculty-App-Source.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <AuthLayout
      variant="login"
      eyebrow="Welcome back"
      title="Your room, your campus, your way."
      description="Sign in to stay on top of room assignments, maintenance requests, and everything that makes campus feel like home."
    >
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d8c7a]">Staff portal</p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#172033]">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage your campus room.</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold text-[#172033]">
          College email
          <span className="relative mt-2 block">
            <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              placeholder="manager@college.edu"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10"
            />
          </span>
        </label>

        <label className="block text-sm font-bold text-[#172033]">
          Password
          <span className="relative mt-2 block">
            <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 rounded-lg p-1 text-[#0d8c7a] transition hover:bg-[#e2f5f1]"
            >
              <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
            </button>
          </span>
        </label>

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-[#0d8c7a]" /> Remember me
          </label>
        </div>

        <button
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-[#0d8c7a] text-sm font-bold text-white shadow-lg shadow-[#0d8c7a]/20 transition hover:bg-[#087364] focus:outline-none focus:ring-4 focus:ring-[#0d8c7a]/20 disabled:cursor-wait disabled:opacity-60"
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in to Roomwise'}
        </button>

        {status.message && (
          <p className={`rounded-lg px-4 py-3 text-center text-xs font-bold ${status.type === 'success' ? 'bg-[#e2f5f1] text-[#087364]' : 'bg-red-50 text-red-700'}`}>
            {status.message}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        New to Roomwise? <button type="button" onClick={onRegister} className="font-bold text-[#0d8c7a] hover:underline">Create an account</button>
      </p>

      {/* DOWNLOAD FACULTY APP CARD */}
      <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-[#e2f5f1]/60 to-teal-50/70 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0d8c7a] text-white shadow-md shadow-[#0d8c7a]/25">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-emerald-600 px-2 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                Android app
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold">Faculty Mobile App</span>
            </div>
            <h3 className="text-sm font-bold text-[#12354a] mt-1">
              Download CRMS for Android
            </h3>
            <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
              Install the CRMS Android app to sign in and access the Faculty portal from your phone.
            </p>

            {/* Action Buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadCrmsApk}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d8c7a] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-[#0d8c7a]/20 hover:bg-[#087364] active:scale-95 transition"
              >
                <Download className="h-4 w-4" />
                <span>Download CRMS.apk</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#0d8c7a]/30 bg-white/80 px-3 py-2 text-xs font-bold text-[#0d8c7a] hover:bg-white active:scale-95 transition"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Setup & Expo Guide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DOWNLOAD / INSTALL MODAL */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDownloadModal(false)
          }}
          aria-modal="true"
          role="dialog"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="CRMS App" className="h-12 w-12 object-contain" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-slate-900">CRMS Faculty Mobile App</h3>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                      Android app
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Official Instructor React Native Application</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile app download */}
            <div className="mt-4 space-y-2.5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0d8c7a] to-[#086a5b] text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Android download</p>
                    <h4 className="text-sm font-bold mt-0.5">CRMS.apk</h4>
                    <p className="text-[10px] text-emerald-100/90 mt-0.5">
                      The CRMS Android app opens to the Faculty login screen
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCrmsApk}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#0d8c7a] hover:bg-emerald-50 active:scale-95 transition shadow-sm shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download APK</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Developer Package</p>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">React Native App Project (.zip)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={downloadFacultySourceZip}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 active:scale-95 transition shadow-xs shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download ZIP</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Device Installation Guide Tabs */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Installation & Setup Guide:
              </p>

              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold mb-3">
                <button
                  type="button"
                  onClick={() => setDeviceTab('android')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    deviceTab === 'android' ? 'bg-white text-[#0d8c7a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Android APK
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('ios')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    deviceTab === 'ios' ? 'bg-white text-[#0d8c7a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expo Go (Live)
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('pc')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    deviceTab === 'pc' ? 'bg-white text-[#0d8c7a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Web Version
                </button>
              </div>

              {/* Guide Content */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-700 space-y-2">
                {deviceTab === 'android' && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">1</span>
                      <p>Tap <strong className="text-[#0d8c7a]">Download APK</strong> above to save <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">CRMS.apk</code> to your Android phone.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">2</span>
                      <p>Open your phone&apos;s <strong className="text-slate-900">Downloads</strong> folder and tap the APK file.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">3</span>
                      <p>If prompted, enable <strong className="text-slate-900">&quot;Allow from this source&quot;</strong>, then tap <strong className="text-[#0d8c7a]">Install</strong>.</p>
                    </div>
                  </>
                )}

                {deviceTab === 'ios' && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">1</span>
                      <p>Install <strong className="text-slate-900">Expo Go</strong> app from the Google Play Store or Apple App Store.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">2</span>
                      <p>In terminal, run <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">cd faculty-chat-app &amp;&amp; npx expo start</code></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">3</span>
                      <p>Scan the QR code with your phone camera or Expo Go to test live on mobile!</p>
                    </div>
                  </>
                )}

                {deviceTab === 'pc' && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">1</span>
                      <p>Click <strong className="text-slate-900">Launch Mobile Portal</strong> below to access the responsive web portal in any browser.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">2</span>
                      <p>Use Chrome or Edge address bar <strong className="text-[#0d8c7a]">Install (⊕)</strong> icon to install as a desktop app!</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Direct Mobile Link & Copy Option */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyAppLink}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
              </button>

              <Link
                to="/login"
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#0d8c7a] py-2.5 text-xs font-bold text-white hover:bg-[#087364] active:scale-95 transition shadow-xs"
              >
                <span>Launch Mobile Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
