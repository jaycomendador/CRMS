import { useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Building,
  Edit2,
  Trash2,
  X,
  Loader2
} from 'lucide-react'

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Engineering',
  'Natural Sciences',
  'Business Administration',
  'Facilities & Maintenance',
  'Humanities'
]

const API = 'http://localhost:5000/api/faculty'

export default function FacultyMembers({ facultyList = [], setFacultyList, isLoading = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const [activeModal, setActiveModal] = useState(null) // null | 'edit'
  const [selectedFaculty, setSelectedFaculty] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Computer Science',
    role: 'Professor',
    assignedBuilding: 'North Hall',
    assignedRoom: '',
    phone: '',
    status: 'Active'
  })

  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Filtered faculty list ──
  const filteredFaculty = useMemo(() => {
    return facultyList.filter(fac => {
      if (selectedDepartment !== 'All Departments' && fac.department !== selectedDepartment) return false
      if (selectedStatus !== 'all' && fac.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          fac.name?.toLowerCase().includes(q) ||
          fac.email?.toLowerCase().includes(q) ||
          fac.department?.toLowerCase().includes(q) ||
          fac.assignedRoom?.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [facultyList, selectedDepartment, selectedStatus, searchQuery])

  function showNotice(msg) {
    setNotice(msg)
    setTimeout(() => setNotice(''), 4000)
  }

  function openEditModal(fac) {
    setSelectedFaculty(fac)
    setFormData({
      name: fac.name,
      email: fac.email,
      department: fac.department || 'Computer Science',
      role: fac.role || 'Professor',
      assignedBuilding: fac.assignedBuilding || '',
      assignedRoom: fac.assignedRoom || '',
      phone: fac.phone || '',
      status: fac.status || 'Active'
    })
    setActiveModal('edit')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!selectedFaculty) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/${selectedFaculty._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const updated = await res.json()
        setFacultyList(prev => prev.map(f => f._id === updated._id ? updated : f))
        showNotice(`Updated ${updated.name} successfully.`)
        setActiveModal(null)
      } else {
        showNotice('Failed to update. Please try again.')
      }
    } catch (err) {
      showNotice('Server offline — could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove ${name} from the faculty directory?`)) return
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setFacultyList(prev => prev.filter(f => f._id !== id))
        showNotice(`${name} has been removed.`)
      } else {
        showNotice('Failed to delete. Please try again.')
      }
    } catch (err) {
      showNotice('Server offline — could not delete.')
    }
  }

  async function handleToggleStatus(fac) {
    const nextStatus = fac.status === 'Active' ? 'On leave' : 'Active'
    try {
      const res = await fetch(`${API}/${fac._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      if (res.ok) {
        const updated = await res.json()
        setFacultyList(prev => prev.map(f => f._id === updated._id ? updated : f))
        showNotice(`${fac.name} set to ${nextStatus}.`)
      }
    } catch (err) {
      showNotice('Server offline — could not update status.')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto space-y-3 overflow-hidden">

      {/* Toast */}
      {notice && (
        <div role="status" className="flex items-center justify-between rounded-lg bg-[#e2f5f1] px-4 py-2.5 text-xs font-bold text-[#087364] shadow-xs">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-[#087364] hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#0d8c7a]" />
              Faculty Members Directory
            </h2>
            <p className="text-xs text-slate-500">
              {isLoading ? 'Loading faculty from database…' : `${filteredFaculty.length} member${filteredFaculty.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search faculty..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-40 sm:w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs outline-none focus:border-[#0d8c7a]"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]"
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On leave">On leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0 mt-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#0d8c7a]" />
              <p className="mt-3 text-sm font-semibold">Loading faculty from database…</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Faculty Member</th>
                  <th className="px-4 py-2.5 font-bold">Department & Role</th>
                  <th className="px-4 py-2.5 font-bold">Assigned Room</th>
                  <th className="px-4 py-2.5 font-bold">Contact</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">
                      <Users className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 font-bold text-slate-600">
                        {facultyList.length === 0 ? 'No faculty members yet' : 'No results match your filters'}
                      </p>
                      <p className="mt-1 text-[11px]">
                        {facultyList.length === 0 ? 'Use "Add faculty" in the sidebar to register the first member.' : 'Try adjusting your search or filter.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map(fac => {
                    const isActive = fac.status === 'Active'
                    return (
                      <tr key={fac._id} className="hover:bg-slate-50/70 transition text-slate-600">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d9f1ed] text-xs font-bold text-[#087364]">
                              {fac.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{fac.name}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {fac.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{fac.department}</p>
                          <p className="text-[10px] text-slate-400">{fac.role}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building className="h-3.5 w-3.5 text-slate-400" />
                            {fac.assignedRoom ? `${fac.assignedRoom}` : '—'}
                          </p>
                          {fac.assignedBuilding && (
                            <p className="text-[10px] text-slate-400 ml-5">{fac.assignedBuilding}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {fac.phone || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : fac.status === 'Inactive'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : fac.status === 'Inactive' ? 'bg-slate-400' : 'bg-amber-500'}`} />
                            {fac.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(fac)}
                              className="rounded-md px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                              {isActive ? 'Set Leave' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(fac)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Edit details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(fac._id, fac.name)}
                              className="rounded-md p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Remove faculty"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#0d8c7a]" />
                Edit Faculty Details
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text" required placeholder="Dr. Robert Vance"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Email *</label>
                  <input
                    type="email" required placeholder="r.vance@campus.edu"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="text" placeholder="(555) 123-4567"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Department</label>
                  <select
                    value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Role / Position</label>
                  <input
                    type="text" placeholder="e.g. Professor"
                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Assigned Building</label>
                  <input
                    type="text" placeholder="e.g. North Hall"
                    value={formData.assignedBuilding} onChange={e => setFormData({ ...formData, assignedBuilding: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Assigned Room</label>
                  <input
                    type="text" placeholder="e.g. Room A-102"
                    value={formData.assignedRoom} onChange={e => setFormData({ ...formData, assignedRoom: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Status</label>
                <select
                  value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                >
                  <option value="Active">Active</option>
                  <option value="On leave">On leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button" onClick={() => setActiveModal(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="rounded-lg bg-[#0d8c7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
