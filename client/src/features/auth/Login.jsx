import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import AuthLayout from './AuthLayout'

export default function Login({ onRegister, onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  return (
    <AuthLayout variant="login" eyebrow="Welcome back" title="Your room, your campus, your way." description="Sign in to stay on top of room assignments, maintenance requests, and everything that makes campus feel like home.">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d8c7a]">Staff portal</p>
        <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#172033]">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage your campus room.</p>
      </div>
      <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold text-[#172033]">College email
          <span className="relative mt-2 block"><Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" /><input required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="manager@college.edu" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10" /></span>
        </label>
        <label className="block text-sm font-bold text-[#172033]">Password
          <span className="relative mt-2 block"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" /><input required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 rounded-lg p-1 text-[#0d8c7a] transition hover:bg-[#e2f5f1]"><span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>{showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</button></span>
        </label>
        <div className="flex items-center gap-3 text-xs"><label className="flex items-center gap-2 text-slate-500"><input type="checkbox" className="h-4 w-4 accent-[#0d8c7a]" /> Remember me</label></div>
        <button disabled={isSubmitting} className="h-12 w-full rounded-xl bg-[#0d8c7a] text-sm font-bold text-white shadow-lg shadow-[#0d8c7a]/20 transition hover:bg-[#087364] focus:outline-none focus:ring-4 focus:ring-[#0d8c7a]/20 disabled:cursor-wait disabled:opacity-60" type="submit">{isSubmitting ? 'Signing in...' : 'Sign in to Roomwise'}</button>
        {status.message && <p className={`rounded-lg px-4 py-3 text-center text-xs font-bold ${status.type === 'success' ? 'bg-[#e2f5f1] text-[#087364]' : 'bg-red-50 text-red-700'}`}>{status.message}</p>}
      </form>
      <p className="mt-8 text-center text-sm text-slate-500">New to Roomwise? <button type="button" onClick={onRegister} className="font-bold text-[#0d8c7a] hover:underline">Create an account</button></p>
    </AuthLayout>
  )
}