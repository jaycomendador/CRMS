import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ClipboardCheck,
  Clock,
  DoorOpen,
  History,
  Key,
  LogOut,
  Eye,
  Search,
  User,
  X
} from 'lucide-react'

const ACTION_TYPES = [
  'All Actions',
  'Key Card Issued',
  'Room Reserved',
  'Room Assigned',
  'Inspection Completed',
  'Room Checked Out',
  'Maintenance Logged'
]

function formatTimestamp(item) {
  if (item.timestamp) return item.timestamp
  if (!item.createdAt) return 'Unknown'
  return new Date(item.createdAt).toLocaleString()
}

export default function RoomHistory() {
  const [historyLogs, setHistoryLogs] = useState([])
  const [facultyList, setFacultyList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState('All Actions')
  const [selectedBuilding, setSelectedBuilding] = useState('All Buildings')
  const [selectedHistory, setSelectedHistory] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchLogs() {
      try {
        const [historyResponse, facultyResponse] = await Promise.all([
          fetch('http://localhost:5000/api/history'),
          fetch('http://localhost:5000/api/faculty')
        ])
        const history = historyResponse.ok ? await historyResponse.json() : []
        const faculty = facultyResponse.ok ? await facultyResponse.json() : []
        if (isMounted) {
          setHistoryLogs(Array.isArray(history) ? history : [])
          setFacultyList(Array.isArray(faculty) ? faculty : [])
        }
      } catch {
        if (isMounted) {
          setHistoryLogs([])
          setFacultyList([])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchLogs()
    return () => { isMounted = false }
  }, [])

  const buildings = useMemo(() => [
    'All Buildings',
    ...new Set(historyLogs.map(item => item.building).filter(Boolean))
  ], [historyLogs])

  const filteredHistory = useMemo(() => historyLogs.filter(item => {
    if (selectedAction !== 'All Actions' && item.action !== selectedAction) return false
    if (selectedBuilding !== 'All Buildings' && item.building !== selectedBuilding) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const searchable = [item.room, item.person, item.building, item.action, item.staff]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!searchable.includes(query)) return false
    }
    return true
  }), [historyLogs, selectedAction, selectedBuilding, searchQuery])

  function getActionIcon(action = '') {
    if (action.includes('Key')) return Key
    if (action.includes('Reserved')) return Clock
    if (action.includes('Assigned')) return DoorOpen
    if (action.includes('Inspection')) return ClipboardCheck
    if (action.includes('Checked Out')) return LogOut
    return History
  }

  return (
    <div className="flex min-h-0 w-full max-w-7xl flex-1 flex-col space-y-3 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><History className="h-5 w-5 text-[#0d8c7a]" />Room History &amp; Activity Logs</h2>
            <p className="text-xs text-slate-500">Chronological history from the server ({filteredHistory.length} records)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" /><input type="text" placeholder="Search history, person, room..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="h-8 w-40 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-8 text-xs outline-none focus:border-[#0d8c7a]" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-400"><X className="h-3.5 w-3.5" /></button>}</div>
            <select value={selectedAction} onChange={event => setSelectedAction(event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]">{ACTION_TYPES.map(action => <option key={action} value={action}>{action}</option>)}</select>
            <select value={selectedBuilding} onChange={event => setSelectedBuilding(event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]">{buildings.map(building => <option key={building} value={building}>{building}</option>)}</select>
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[820px] text-left text-xs"><thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-2.5 font-bold">Date &amp; Time</th><th className="px-4 py-2.5 font-bold">Room &amp; Building</th><th className="px-4 py-2.5 font-bold">Person / Occupant</th><th className="px-4 py-2.5 font-bold">Action Performed</th><th className="px-4 py-2.5 font-bold">Status</th><th className="px-4 py-2.5 font-bold">Role</th><th className="px-4 py-2.5 text-right font-bold">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading history records...</td></tr> : filteredHistory.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-slate-400"><History className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 font-bold text-slate-600">No room history records found</p></td></tr> : filteredHistory.map(item => { const ActionIcon = getActionIcon(item.action); const faculty = facultyList.find(member => member.name?.toLowerCase() === item.person?.toLowerCase()); const statusColor = item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'; return <tr key={item._id} className="text-slate-600 transition hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{formatTimestamp(item)}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2 font-extrabold text-slate-900"><DoorOpen className="h-4 w-4 text-[#0d8c7a]" />{item.room}</div><p className="ml-6 text-[10px] text-slate-400">{item.building}</p></td><td className="px-4 py-3"><span className="flex items-center gap-1.5 font-bold text-slate-800"><User className="h-3.5 w-3.5 text-slate-400" />{item.person}</span></td><td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-800"><ActionIcon className="h-3.5 w-3.5 text-[#0d8c7a]" />{item.action}</span></td><td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusColor}`}>{item.status}</span></td><td className="px-4 py-3 font-medium text-slate-700">{faculty?.role || 'Not specified'}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => setSelectedHistory(item)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:border-[#0d8c7a] hover:text-[#0d8c7a]" title="View history details"><Eye className="h-3.5 w-3.5" />View</button></td></tr> })}</tbody>
          </table>
        </div>
      </div>
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><Eye className="h-4 w-4 text-[#0d8c7a]" />History Details</h3><button type="button" onClick={() => setSelectedHistory(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs"><p><strong>Room:</strong> {selectedHistory.room}</p><p><strong>Building:</strong> {selectedHistory.building}</p><p><strong>Person:</strong> {selectedHistory.person}</p><p><strong>Action:</strong> {selectedHistory.action}</p><p><strong>Status:</strong> {selectedHistory.status}</p><p><strong>Date:</strong> {formatTimestamp(selectedHistory)}</p><p><strong>Notes:</strong> {selectedHistory.notes || 'None'}</p></div>
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3"><button type="button" onClick={() => setSelectedHistory(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
