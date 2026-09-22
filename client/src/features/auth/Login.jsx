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
  RefreshCw,
  Smartphone,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'

// ── GitHub release auto-fetch ──────────────────────────────────────────────
// This fetches the latest release from GitHub every time the page loads.
// Just push + merge a new release — the download button updates automatically.
const GITHUB_REPO = 'jaycomendador/crms'

async function fetchLatestRelease() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
  if (!res.ok) throw new Error('Could not fetch release')
  const data = await res.json()
  const apkAsset = data.assets?.find((a) => a.name.toLowerCase().endsWith('.apk'))
  return {
    version: data.tag_name || 'latest',
    name: data.name || 'CRMS',
    downloadUrl: apkAsset?.browser_download_url || null,
    fileName: apkAsset?.name || 'CRMS.apk',
    sizeMB: apkAsset ? (apkAsset.size / (1024 * 1024)).toFixed(1) : null,
    publishedAt: data.published_at
      ? new Date(data.published_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null,
  }
}

export default function Login({ onRegister, onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Download & Install App modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [deviceTab, setDeviceTab] = useState('android')

  // Latest GitHub release state
  const [release, setRelease] = useState(null)
  const [releaseLoading, setReleaseLoading] = useState(true)
  const [releaseError, setReleaseError] = useState(false)

  // Fetch latest release on mount
  useEffect(() => {
    setReleaseLoading(true)
    setReleaseError(false)
    fetchLatestRelease()
      .then(setRelease)
      .catch(() => setReleaseError(true))
      .finally(() => setReleaseLoading(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to sign in.')
      onLogin(data.staff)
    } catch (error) {
      if (error.name === 'TypeError' || error.message.toLowerCase().includes('fetch')) {
        setStatus({
          type: 'error',
          message: `Cannot reach server at ${
            import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
          }. Make sure the backend is running and your device is on the same network.`,
        })
      } else {
        setStatus({ type: 'error', message: error.message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCopyAppLink() {
    const portalUrl = `${window.location.origin}/login`
    navigator.clipboard?.writeText(portalUrl).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    })
  }

  function downloadApk() {
    if (release?.downloadUrl) {
      window.location.assign(release.downloadUrl)
    }
  }

  function downloadFacultySourceZip() {
    const zipUrl = '/downloads/CRMS-Faculty-App-Source.zip'
    const a = document.createElement('a')
    a.href = zipUrl
    a.download = 'CRMS-Faculty-App-Source.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ── Derived release display values ─────────────────────────────────────
  const apkReady = !releaseLoading && !releaseError && release?.downloadUrl
  const releaseLabel = release
    ? `${release.fileName}${release.sizeMB ? ` · ${release.sizeMB} MB` : ''}`
    : null

  return (
    <AuthLayout
      variant="login"
      eyebrow="Welcome back"
      title="Your room, your campus, your way."
      description="Sign in to stay on top of room assignments, maintenance requests, and everything that makes campus feel like home."
    >
      {/* ── MOBILE LOGO HEADER ────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col items-center gap-2 lg:hidden">
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-[#0d8c7a]/20 blur-xl scale-110" />
          <img
            src="/logo.png"
            alt="CRMS Logo"
            className="relative h-20 w-20 object-contain drop-shadow-xl"
          />
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold leading-tight text-[#12354a] tracking-tight">
            CRMS Faculty
          </p>
          <p className="text-[11px] text-slate-500 font-medium tracking-wide">
            Classroom &amp; Resource Management System
          </p>
        </div>
      </div>

      {/* ── SIGN IN HEADING ───────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d8c7a]">Staff portal</p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#172033]">
          Faculty Sign In
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Use your CRMS credentials to access the chat portal.
        </p>
      </div>

      {/* ── LOGIN FORM ────────────────────────────────────────────────── */}
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold text-[#172033]">
          Email Address
          <span className="relative mt-2 block">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400"
            />
            <input
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              placeholder="jcomendador120@gmail.com"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10"
            />
          </span>
        </label>

        <label className="block text-sm font-bold text-[#172033]">
          Password
          <span className="relative mt-2 block">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400"
            />
            <input
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Eye aria-hidden="true" className="h-5 w-5" />
              )}
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
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>

        {status.message && (
          <div
            className={`flex items-start gap-2 rounded-xl px-4 py-3 text-xs font-semibold ${
              status.type === 'success'
                ? 'bg-[#e2f5f1] text-[#087364]'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{status.message}</span>
          </div>
        )}
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        New to CRMS?{' '}
        <button
          type="button"
          onClick={onRegister}
          className="font-bold text-[#0d8c7a] hover:underline"
        >
          Create an account
        </button>
      </p>

      {/* ── DOWNLOAD CARD ─────────────────────────────────────────────── */}
      <div className="mt-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-[#e2f5f1]/60 to-teal-50/70 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="relative shrink-0">
            <img
              src="/logo.png"
              alt="CRMS App"
              className="h-12 w-12 rounded-2xl object-contain shadow-md ring-2 ring-white"
            />
            {apkReady && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                Android App
              </span>
              {release?.version && (
                <span className="rounded-full bg-[#12354a] px-2 py-0.5 text-[9px] font-bold text-[#55d6c1] tracking-wider">
                  {release.version}
                </span>
              )}
              {releaseLoading && (
                <RefreshCw className="h-3 w-3 text-slate-400 animate-spin" />
              )}
            </div>

            <h3 className="text-sm font-bold text-[#12354a] mt-1">
              Download CRMS for Android
            </h3>

            {/* Release info line */}
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate">
              {releaseLoading
                ? 'Checking for latest release…'
                : releaseError
                ? 'Faculty Mobile App · CRMS Android'
                : `${release?.fileName}${release?.sizeMB ? ` · ${release.sizeMB} MB` : ''}${release?.publishedAt ? ` · ${release.publishedAt}` : ''}`}
            </p>

            {/* Buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadApk}
                disabled={!apkReady}
                title={apkReady ? `Download ${release?.fileName}` : 'Loading release info…'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d8c7a] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-[#0d8c7a]/20 hover:bg-[#087364] active:scale-95 transition disabled:opacity-50 disabled:cursor-wait"
              >
                <Download className="h-4 w-4" />
                <span>
                  {releaseLoading
                    ? 'Loading…'
                    : apkReady
                    ? `Download ${release?.version ?? 'APK'}`
                    : 'Unavailable'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#0d8c7a]/30 bg-white/80 px-3 py-2 text-xs font-bold text-[#0d8c7a] hover:bg-white active:scale-95 transition"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Setup &amp; Expo Guide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SETUP / INSTALL MODAL ─────────────────────────────────────── */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDownloadModal(false)
          }}
          aria-modal="true"
          role="dialog"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 overflow-hidden">
            {/* Decorative top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-[#0d8c7a] via-[#55d6c1] to-[#0d8c7a]" />

            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="CRMS App"
                  className="h-12 w-12 rounded-2xl object-contain shadow ring-1 ring-slate-100"
                />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">CRMS Faculty App</h3>
                    {release?.version && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                        {release.version}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Official Faculty Android Application</p>
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

            {/* Download options */}
            <div className="mt-4 space-y-2.5">
              {/* APK card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0d8c7a] to-[#086a5b] text-white shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                      Android Download
                    </p>
                    <h4 className="text-sm font-bold mt-0.5 truncate">
                      {release?.fileName ?? 'CRMS.apk'}
                    </h4>
                    <p className="text-[10px] text-emerald-100/90 mt-0.5">
                      {release?.sizeMB ? `${release.sizeMB} MB` : ''}
                      {release?.publishedAt ? ` · Released ${release.publishedAt}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadApk}
                    disabled={!apkReady}
                    className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#0d8c7a] hover:bg-emerald-50 active:scale-95 transition shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download APK</span>
                  </button>
                </div>
              </div>

              {/* Source ZIP card */}
              <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 text-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Developer Package
                    </p>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                      React Native App Project (.zip)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={downloadFacultySourceZip}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 active:scale-95 transition shadow-sm shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download ZIP</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Installation Guide Tabs */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Installation &amp; Setup Guide:
              </p>
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold mb-3">
                {[
                  { id: 'android', label: 'Android APK' },
                  { id: 'ios', label: 'Expo Go (Live)' },
                  { id: 'pc', label: 'Web Version' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDeviceTab(tab.id)}
                    className={`flex-1 py-1.5 rounded-lg transition text-center ${
                      deviceTab === tab.id
                        ? 'bg-white text-[#0d8c7a] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs text-slate-700 space-y-2">
                {deviceTab === 'android' && (
                  <>
                    <Step n={1}>
                      Tap <strong className="text-[#0d8c7a]">Download APK</strong> above to save{' '}
                      <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">
                        {release?.fileName ?? 'CRMS.apk'}
                      </code>{' '}
                      to your Android phone.
                    </Step>
                    <Step n={2}>
                      Open your phone&apos;s <strong className="text-slate-900">Downloads</strong>{' '}
                      folder and tap the APK file.
                    </Step>
                    <Step n={3}>
                      If prompted, enable{' '}
                      <strong className="text-slate-900">&quot;Allow from this source&quot;</strong>
                      , then tap <strong className="text-[#0d8c7a]">Install</strong>.
                    </Step>
                  </>
                )}
                {deviceTab === 'ios' && (
                  <>
                    <Step n={1}>
                      Install <strong className="text-slate-900">Expo Go</strong> app from the Google
                      Play Store or Apple App Store.
                    </Step>
                    <Step n={2}>
                      In terminal, run{' '}
                      <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">
                        cd faculty-chat-app &amp;&amp; npx expo start
                      </code>
                    </Step>
                    <Step n={3}>
                      Scan the QR code with your phone camera or Expo Go to test live on mobile!
                    </Step>
                  </>
                )}
                {deviceTab === 'pc' && (
                  <>
                    <Step n={1}>
                      Click{' '}
                      <strong className="text-slate-900">Launch Mobile Portal</strong> below to
                      access the responsive web portal in any browser.
                    </Step>
                    <Step n={2}>
                      Use Chrome or Edge address bar{' '}
                      <strong className="text-[#0d8c7a]">Install (⊕)</strong> icon to install as a
                      desktop app!
                    </Step>
                  </>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyAppLink}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
              >
                {copiedLink ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
              </button>
              <Link
                to="/login"
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#0d8c7a] py-2.5 text-xs font-bold text-white hover:bg-[#087364] active:scale-95 transition shadow-sm"
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

// ── Helper: numbered step ───────────────────────────────────────────────────
function Step({ n, children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0d8c7a] text-white text-[10px] font-bold">
        {n}
      </span>
      <p>{children}</p>
    </div>
  )
}
