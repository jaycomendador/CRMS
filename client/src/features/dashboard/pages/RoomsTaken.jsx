import { useState, useMemo, useEffect } from 'react'
import { DoorClosed, Search, Building, User, X, CheckCircle2 } from 'lucide-react'

function toRoomName(value) {
  return value?.replace(/^Room\s+/i, '').trim().toLowerCase()
}

export default function RoomsTaken({ onDone }) {
  const [assignments, setAssignments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    let isMounted = true

    async function loadAssignments() {
      try {
        const [roomsResponse, facultyResponse] = await Promise.all([
          fetch('http://localhost:5000/api/rooms'),
          fetch('http://localhost:5000/api/faculty')
        ])
        const [rooms, faculty] = await Promise.all([
          roomsResponse.ok ? roomsResponse.json() : [],
          facultyResponse.ok ? facultyResponse.json() : []
        ])

        const facultyList = Array.isArray(faculty) ? faculty : []
        const roomAssignments = (Array.isArray(rooms) ? rooms : [])
          .filter(room => room.status === 'Occupied' || room.assignedTo)
          .map(room => {
            const assignedFaculty = facultyList.find(member => (
              toRoomName(member.assignedRoom) === toRoomName(room.name) &&
              (!member.assignedBuilding || member.assignedBuilding === room.building)
            ))

            return {
              _id: room._id,
              room: room.name,
              building: room.building,
              faculty: assignedFaculty?.name || room.assignedTo || 'Unassigned',
              department: assignedFaculty?.department || 'Not specified',
              status: assignedFaculty || room.assignedTo ? 'Assigned' : room.status,
              dateAssigned: room.updatedAt ? new Date(room.updatedAt).toISOString().slice(0, 10) : 'Not specified'
            }
          })

        if (isMounted) setAssignments(roomAssignments)
      } catch {
        if (isMounted) setAssignments([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAssignments()
    return () => { isMounted = false }
  }, [])

  async function handleDone(assignment) {
    try {
      const roomResponse = await fetch(`http://localhost:5000/api/rooms/${assignment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Available', assignedTo: '' })
      })
      if (!roomResponse.ok) throw new Error('Room update failed')

      const historyResponse = await fetch('http://localhost:5000/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: assignment.room,
          building: assignment.building,
          person: assignment.faculty,
          action: 'Room Checked Out',
          status: 'Returned',
          notes: 'Room assignment marked done.'
        })
      })
      if (!historyResponse.ok) throw new Error('History update failed')

      setAssignments(prev => prev.filter(item => item._id !== assignment._id))
      onDone?.()
    } catch {
      setNotice('Unable to complete this assignment. Please try again.')
    }
  }

  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchRoom = item.room.toLowerCase().includes(q)
        const matchFaculty = item.faculty.toLowerCase().includes(q)
        const matchDept = item.department.toLowerCase().includes(q)
        const matchBuilding = item.building.toLowerCase().includes(q)
        if (!matchRoom && !matchFaculty && !matchDept && !matchBuilding) return false
      }
      return true
    })
  }, [assignments, selectedStatus, searchQuery])

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto space-y-3 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm overflow-hidden">
        {notice && <div role="status" className="mb-3 flex items-center justify-between rounded-lg bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700"><span>{notice}</span><button type="button" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}
        
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <DoorClosed className="h-5 w-5 text-[#0d8c7a]" />
              Rooms Taken Directory
            </h2>
            <p className="text-xs text-slate-500">
              Track faculty assignments to occupied rooms across campus buildings ({filteredAssignments.length} occupied)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-40 sm:w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs outline-none focus:border-[#0d8c7a]"
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

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]"
            >
              <option value="all">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Occupied">Occupied</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="flex-1 overflow-auto min-h-0 mt-3">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5 font-bold">Room</th>
                <th className="px-4 py-2.5 font-bold">Building</th>
                <th className="px-4 py-2.5 font-bold">Faculty Member</th>
                <th className="px-4 py-2.5 font-bold">Department</th>
                <th className="px-4 py-2.5 font-bold">Assignment Date</th>
                <th className="px-4 py-2.5 font-bold text-right">Status</th>
                <th className="px-4 py-2.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading room assignments...</td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <DoorClosed className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-bold text-slate-600">No room assignments match query</p>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(assignment => (
                  <tr key={assignment.room} className="hover:bg-slate-50 transition text-slate-600">
                    <td className="px-4 py-3 font-extrabold text-slate-900 flex items-center gap-2">
                      <DoorClosed className="h-4 w-4 text-[#0d8c7a]" />
                      {assignment.room}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {assignment.building}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {assignment.faculty}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{assignment.department}</td>
                    <td className="px-4 py-3 text-slate-500">{assignment.dateAssigned}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        assignment.status === 'Assigned' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => handleDone(assignment)} className="inline-flex items-center gap-1 rounded-lg bg-[#0d8c7a] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#087364]" title="Complete assignment">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
