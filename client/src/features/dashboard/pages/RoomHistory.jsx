import { useState, useEffect, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  Building,
  User,
  Clock,
  CheckCircle2,
  Key,
  DoorOpen,
  ClipboardCheck,
  LogOut,
  X,
  Calendar
} from 'lucide-react'

const INITIAL_HISTORY = [
  {
    _id: 'hist-1',
    room: 'Room A-102',
    building: 'North Hall',
    person: 'Jordan Lee (Resident)',
    action: 'Key Card Issued',
    status: 'Active',
    staff: 'Officer Marcus Vance',
    timestamp: 'Today, 2:15 PM',
    notes: 'Key card #8841 programmed and distributed.'
  },
  {
    _id: 'hist-2',
    room: 'Room B-204',
    building: 'West Residence',
    person: 'Dr. Evelyn Reed (Faculty)',
    action: 'Room Reserved',
    status: 'Completed',
    staff: 'Staff Admin',
    timestamp: 'Today, 11:30 AM',
    notes: 'Department meeting reservation confirmed.'
  },
  {
    _id: 'hist-3',
    room: 'Room C-307',
    building: 'Central Hall',
    person: 'Noah Williams (Student)',
    action: 'Room Assigned',
    status: 'Active',
    staff: 'Sarah Jenkins',
    timestamp: 'Yesterday, 4:45 PM',
    notes: 'Fall semester room assignment completed.'
  },
  {
    _id: 'hist-4',
    room: 'Room D-118',
    building: 'South Hall',
    person: 'Prof. Marcus Lee (Faculty)',
    action: 'Inspection Completed',
    status: 'Completed',
    staff: 'Officer Marcus Vance',
    timestamp: 'Yesterday, 10:15 AM',
    notes: 'Annual safety & equipment check passed.'
  },
  {
    _id: 'hist-5',
    room: 'Room A-101',
    building: 'North Hall',
    person: 'Maya Chen (Former Resident)',
    action: 'Room Checked Out',
    status: 'Returned',
    staff: 'Housing Staff',
    timestamp: '2026-09-07, 3:00 PM',
    notes: 'Keys returned, move-out inspection approved.'
  },
  {
    _id: 'hist-6',
    room: 'Lab 1',
    building: 'CCIS Building',
    person: 'Dr. Elena Cruz (CS Dept)',
    action: 'Room Reserved',
    status: 'Completed',
    staff: 'Staff Admin',
    timestamp: '2026-09-06, 9:00 AM',
    notes: 'Lab reservation for CS 301 midterms.'
  }
]

const ACTION_TYPES = [
  'All Actions',
  'Key Card Issued',
  'Room Reserved',
  'Room Assigned',
  'Inspection Completed',
  'Room Checked Out'
]

const BUILDINGS = ['All Buildings', 'North Hall', 'West Residence', 'Central Hall', 'South Hall', 'CCIS Building']

export default function RoomHistory() {
  const [historyLogs, setHistoryLogs] = useState(INITIAL_HISTORY)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState('All Actions')
  const [selectedBuilding, setSelectedBuilding] = useState('All Buildings')

  // Fetch history logs from API if available
  useEffect(() => {
    let isMounted = true
    async function fetchLogs() {
      try {
        const res = await fetch('http://localhost:5000/api/history')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setHistoryLogs(data)
          }
        }
      } catch (err) {
        // Backend offline fallback
      }
    }
    fetchLogs()
    return () => { isMounted = false }
  }, [])

  // Filtered history
  const filteredHistory = useMemo(() => {
    return historyLogs.filter(item => {
      if (selectedAction !== 'All Actions' && item.action !== selectedAction) return false
      if (selectedBuilding !== 'All Buildings' && item.building !== selectedBuilding) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchRoom = item.room.toLowerCase().includes(q)
        const matchPerson = item.person.toLowerCase().includes(q)
        const matchBuilding = item.building.toLowerCase().includes(q)
        const matchAction = item.action.toLowerCase().includes(q)
        const matchStaff = item.staff.toLowerCase().includes(q)
        if (!matchRoom && !matchPerson && !matchBuilding && !matchAction && !matchStaff) return false
      }
      return true
    })
  }, [historyLogs, selectedAction, selectedBuilding, searchQuery])

  function getActionIcon(actionStr) {
    if (actionStr.includes('Key')) return Key
    if (actionStr.includes('Reserved')) return Clock
    if (actionStr.includes('Assigned')) return DoorOpen
    if (actionStr.includes('Inspection')) return ClipboardCheck
    if (actionStr.includes('Checked Out')) return LogOut
    return History
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto space-y-3 overflow-hidden">
      
      {/* Main Full-Height Card */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5 text-[#0d8c7a]" />
              Room History & Activity Logs
            </h2>
            <p className="text-xs text-slate-500">
              Chronological history of room assignments, reservations, key issues, and occupants ({filteredHistory.length} records)
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history, person, room..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-40 sm:w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs outline-none focus:border-[#0d8c7a]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Action Type Filter */}
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]"
            >
              {ACTION_TYPES.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Building Filter */}
            <select
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]"
            >
              {BUILDINGS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

          </div>
        </div>

        {/* History Table Container */}
        <div className="flex-1 overflow-auto min-h-0 mt-3">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5 font-bold">Date & Time</th>
                <th className="px-4 py-2.5 font-bold">Room & Building</th>
                <th className="px-4 py-2.5 font-bold">Person / Occupant</th>
                <th className="px-4 py-2.5 font-bold">Action Performed</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold text-right">Staff Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <History className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-bold text-slate-600">No room history records found</p>
                    <p className="mt-1 text-[11px]">Try adjusting your search query or action filter.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map(item => {
                  const IconComp = getActionIcon(item.action)
                  const statusColors = {
                    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Completed: 'bg-blue-50 text-blue-700 border-blue-200',
                    Returned: 'bg-slate-100 text-slate-600 border-slate-200',
                    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200'
                  }

                  return (
                    <tr key={item._id} className="hover:bg-slate-50 transition text-slate-600">
                      <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {item.timestamp}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-extrabold text-slate-900">
                          <DoorOpen className="h-4 w-4 text-[#0d8c7a]" />
                          {item.room}
                        </div>
                        <p className="ml-6 text-[10px] text-slate-400">{item.building}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {item.person}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
                          <IconComp className="h-3.5 w-3.5 text-[#0d8c7a]" />
                          {item.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusColors[item.status] || 'bg-slate-100'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {item.staff}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}
