import { useState } from 'react'
import { UserPlus, CheckCircle, Mail, Building, Phone, User, Loader2 } from 'lucide-react'

const DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Natural Sciences',
  'Business Administration',
  'Facilities & Maintenance',
  'Humanities'
]

const EMPTY_FORM = {
  name: '',
  email: '',
  department: 'Computer Science',
  role: '',
  assignedBuilding: '',
  phone: '',
  status: 'Active'
}

export default function AddFaculty({ onFacultyAdded }) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [statusNotice, setStatusNotice] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) return

    setIsSubmitting(true)
    setStatusNotice(null)

    try {
      const res = await fetch('http://localhost:5000/api/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const savedFaculty = await res.json()
        setStatusNotice({ type: 'success', message: `${savedFaculty.name} has been registered and added to the faculty directory!` })
        setFormData(EMPTY_FORM)
        // Pass the real DB document back up so FacultyMembers updates instantly
        if (onFacultyAdded) onFacultyAdded(savedFaculty)
      } else {
        const err = await res.json().catch(() => ({}))
        setStatusNotice({ type: 'error', message: err.message || 'Failed to register faculty member. Please try again.' })
      }
    } catch (err) {
      setStatusNotice({ type: 'error', message: 'Cannot reach the server. Please check your connection.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 overflow-auto pb-4">
      {statusNotice && (
        <div className={`flex items-center gap-2 rounded-xl border p-4 text-xs font-bold shadow-xs ${
          statusNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusNotice.type === 'success'
            ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            : <span className="h-5 w-5 shrink-0 text-red-500">!</span>}
          <span>{statusNotice.message}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="rounded-xl bg-[#e2f5f1] p-3 text-[#0d8c7a]">
            <UserPlus className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Faculty Member</h2>
            <p className="text-xs text-slate-500">
              Register a new faculty profile — saved directly to the database and visible in Faculty Members.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Name & Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Full Name *</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text" required placeholder="e.g. Dr. Robert Vance"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Email Address *</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email" required placeholder="r.vance@campus.edu"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>
            </div>
          </div>

          {/* Department & Role */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Department</label>
              <select
                value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-[#0d8c7a]"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Role / Position</label>
              <input
                type="text" placeholder="e.g. Associate Professor"
                value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-[#0d8c7a]"
              />
            </div>
          </div>

          {/* Building */}
          <div>
            <label className="block text-xs font-bold text-slate-700">Assigned Building</label>
            <div className="relative mt-1">
              <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text" placeholder="e.g. West Residence"
                value={formData.assignedBuilding} onChange={e => setFormData({ ...formData, assignedBuilding: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-[#0d8c7a]"
              />
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Phone Contact</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text" placeholder="(555) 123-4567"
                  value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Status</label>
              <select
                value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-[#0d8c7a]"
              >
                <option value="Active">Active</option>
                <option value="On leave">On leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="submit" disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0d8c7a] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#087364] shadow-sm transition disabled:opacity-60 disabled:cursor-wait"
            >
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering…</>
                : <><UserPlus className="h-4 w-4" /> Register Faculty Member</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
