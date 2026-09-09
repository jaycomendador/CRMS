import { ArrowRight, Building2 } from 'lucide-react'

export default function DashboardPage({ title, description, icon: Icon, children }) {
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-4 rounded-2xl bg-[#e8f3ff] px-6 py-6 sm:px-8">
        <span className="rounded-xl bg-white p-3 text-[#0d8c7a] shadow-sm"><Icon aria-hidden="true" className="h-6 w-6" /></span>
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d8c7a]">College Room Management System</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div>
      </div>
      {children || <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><Building2 aria-hidden="true" className="mx-auto h-10 w-10 text-[#0d8c7a]" /><p className="mt-3 text-sm font-bold text-slate-800">{title} workspace</p><p className="mt-1 text-xs text-slate-500">Manage this area from your staff dashboard.</p><button type="button" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0d8c7a] px-4 py-2 text-xs font-bold text-white hover:bg-[#087364]">Get started <ArrowRight aria-hidden="true" className="h-4 w-4" /></button></div>}
    </section>
  )
}
