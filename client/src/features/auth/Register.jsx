import { useState } from 'react'
import { Building2, Eye, EyeOff, KeyRound, LockKeyhole, Mail } from 'lucide-react'
import AuthLayout from './AuthLayout'

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ accountType: 'Residence building', organizationName: '', email: '', password: '', confirmation: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    if (form.password !== form.confirmation) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: form.accountType, organizationName: form.organizationName, email: form.email, password: form.password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to create the staff account.')
      setStatus({ type: 'success', message: 'Staff account created. You can sign in now.' })
      setForm({ accountType: 'Residence building', organizationName: '', email: '', password: '', confirmation: '' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout variant="register" eyebrow="Set up your campus" title="A better home for campus operations." description="Create a department or building account to manage rooms, resident requests, and the day-to-day work of campus living.">
      <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d8c7a]">Staff portal</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#172033]">Register your space</h2><p className="mt-2 text-sm text-slate-500">For departments and residence buildings only.</p></div>
      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold text-[#172033]">Account type<span className="relative mt-1.5 block"><Building2 aria-hidden="true" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" /><select value={form.accountType} onChange={(event) => setForm({ ...form, accountType: event.target.value })} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-12 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10"><option>Residence building</option><option>Campus department</option></select></span></label>
        <label className="block text-sm font-bold text-[#172033]">Department or building name<span className="relative mt-1.5 block"><Building2 aria-hidden="true" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" /><input required value={form.organizationName} onChange={(event) => setForm({ ...form, organizationName: event.target.value })} type="text" placeholder="North Hall" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10" /></span></label>
        <label className="block text-sm font-bold text-[#172033]">Staff email<span className="relative mt-1.5 block"><Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" /><input required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="manager@college.edu" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10" /></span></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-bold text-[#172033]">Create password<span className="relative mt-1.5 block"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" /><input required minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type={showPassword ? 'text' : 'password'} placeholder="8+ characters" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-11 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 rounded-lg p-1 text-[#0d8c7a] transition hover:bg-[#e2f5f1]"><span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>{showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</button></span></label><label className="block text-sm font-bold text-[#172033]">Confirm password<span className="relative mt-1.5 block"><KeyRound aria-hidden="true" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" /><input required minLength="8" value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} type={showConfirmation ? 'text' : 'password'} placeholder="Repeat password" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-11 text-sm outline-none transition focus:border-[#0d8c7a] focus:ring-4 focus:ring-[#0d8c7a]/10" /><button type="button" aria-label={showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'} onClick={() => setShowConfirmation(!showConfirmation)} className="absolute right-2 top-2 rounded-lg p-1 text-[#0d8c7a] transition hover:bg-[#e2f5f1]"><span className="sr-only">{showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}</span>{showConfirmation ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</button></span></label></div>
        <label className="flex items-start gap-2 pt-1 text-xs leading-5 text-slate-500"><input required type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#0d8c7a]" /> I agree to the campus housing administration policy.</label>
        <button disabled={isSubmitting} className="h-11 w-full rounded-xl bg-[#0d8c7a] text-sm font-bold text-white shadow-lg shadow-[#0d8c7a]/20 transition hover:bg-[#087364] focus:outline-none focus:ring-4 focus:ring-[#0d8c7a]/20 disabled:cursor-wait disabled:opacity-60" type="submit">{isSubmitting ? 'Creating account...' : 'Create staff account'}</button>
        {status.message && <p className={`rounded-lg px-4 py-3 text-center text-xs font-bold ${status.type === 'success' ? 'bg-[#e2f5f1] text-[#087364]' : 'bg-red-50 text-red-700'}`}>{status.message}</p>}
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <button type="button" onClick={onLogin} className="font-bold text-[#0d8c7a] hover:underline">Sign in</button></p>
    </AuthLayout>
  )
}