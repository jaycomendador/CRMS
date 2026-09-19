import { useState } from 'react'
import { Building2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function AdminAuth({ mode, onAuthenticated, onSwitchMode }) {
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ name: '', organizationName: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) { setForm(current => ({ ...current, [field]: value })) }

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/admin/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to continue.')
      onAuthenticated(data.admin)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-950 p-5 sm:grid sm:place-items-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden bg-gradient-to-br from-[#075d55] via-[#087c70] to-[#102b48] p-10 text-white lg:block">
          <div className="flex items-center gap-3 text-lg font-extrabold"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15"><Building2 /></span>CRMS Command Center</div>
          <div className="mt-28"><p className="text-sm font-bold uppercase tracking-[.22em] text-teal-200">Administrator portal</p><h1 className="mt-4 text-4xl font-black leading-tight">Run every room, team, and campus event from one place.</h1><p className="mt-5 max-w-md text-sm leading-6 text-teal-50/80">Your private CRMS admin space provides a live picture of room usage, faculty activity, maintenance, and campus scheduling.</p></div>
        </section>
        <section className="p-7 sm:p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#087c70]"><ShieldCheck /></div>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-[#087c70]">Secure administrator access</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{isRegister ? 'Create admin account' : 'Welcome, administrator'}</h2>
          <p className="mt-2 text-sm text-slate-500">{isRegister ? 'Set up the account that manages your CRMS campus.' : 'Sign in to your dedicated CRMS command center.'}</p>
          <form className="mt-7 space-y-4" onSubmit={submit}>
            {isRegister && <Field icon={UserRound} label="Administrator name" value={form.name} onChange={value => update('name', value)} placeholder="Alex Morgan" />}
            {isRegister && <Field icon={Building2} label="College or organization" value={form.organizationName} onChange={value => update('organizationName', value)} placeholder="North Campus College" />}
            <Field icon={Mail} label="Administrator email" type="email" value={form.email} onChange={value => update('email', value)} placeholder="admin@college.edu" />
            <Field icon={LockKeyhole} label="Password" type="password" value={form.password} onChange={value => update('password', value)} placeholder="At least 8 characters" />
            {message && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{message}</p>}
            <button disabled={submitting} className="h-12 w-full rounded-xl bg-[#087c70] text-sm font-bold text-white shadow-lg shadow-teal-900/15 hover:bg-[#06675e] disabled:opacity-60">{submitting ? 'Please wait…' : isRegister ? 'Create administrator account' : 'Open command center'}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">{isRegister ? 'Already have an admin account?' : 'Setting up CRMS for the first time?'} <button onClick={onSwitchMode} className="font-bold text-[#087c70] hover:underline">{isRegister ? 'Sign in' : 'Create account'}</button></p>
        </section>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<span className="relative mt-1.5 block"><Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-normal outline-none focus:border-[#087c70] focus:ring-4 focus:ring-teal-100" /></span></label>
}
