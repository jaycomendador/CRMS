import { useState, useEffect, useMemo } from 'react'
import {
  DoorOpen,
  Plus,
  Search,
  Filter,
  Building,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Layers,
  Hash
} from 'lucide-react'

const INITIAL_ROOMS = [
  { _id: 'rm-1', name: 'Room A-101', building: 'North Hall', type: 'Single room', capacity: 1, status: 'Available', assignedTo: '' },
  { _id: 'rm-2', name: 'Room A-102', building: 'North Hall', type: 'Single room', capacity: 1, status: 'Occupied', assignedTo: 'Jordan Lee' },
  { _id: 'rm-3', name: 'Room A-103', building: 'North Hall', type: 'Double room', capacity: 2, status: 'Reserved', assignedTo: 'Sofia Patel' },
  { _id: 'rm-4', name: 'Room B-201', building: 'West Residence', type: 'Single room', capacity: 1, status: 'Available', assignedTo: '' },
  { _id: 'rm-5', name: 'Room B-204', building: 'West Residence', type: 'Double room', capacity: 2, status: 'Occupied', assignedTo: 'Dr. Evelyn Reed' },
  { _id: 'rm-6', name: 'Room C-301', building: 'Central Hall', type: 'Faculty suite', capacity: 3, status: 'Under maintenance', assignedTo: 'Tech Alex Rivera' },
  { _id: 'rm-7', name: 'Room C-307', building: 'Central Hall', type: 'Single room', capacity: 1, status: 'Occupied', assignedTo: 'Noah Williams' },
  { _id: 'rm-8', name: 'Room D-118', building: 'South Hall', type: 'Faculty suite', capacity: 4, status: 'Available', assignedTo: '' },
]

const BUILDINGS = ['All Buildings', 'North Hall', 'West Residence', 'Central Hall', 'South Hall', 'Science Quad']
const ROOM_TYPES = ['Single room', 'Double room', 'Faculty suite', 'Conference room', 'Lab']
const ROOM_STATUSES = ['Available', 'Occupied', 'Reserved', 'Under maintenance']

export default function Rooms() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('All Buildings')
  const [selectedStatus, setSelectedStatus] = useState('all')
  
  const [activeModal, setActiveModal] = useState(null) // null | 'add' | 'edit'
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [notice, setNotice] = useState('')

  // Batch / Single Add Room Form State
  const [formData, setFormData] = useState({
    namePrefix: 'Room A-',
    startNumber: 101,
    quantity: 1,
    building: 'North Hall',
    type: 'Single room',
    capacity: 1,
    status: 'Available',
    assignedTo: ''
  })

  // Edit single room state
  const [editFormData, setEditFormData] = useState({
    name: '',
    building: 'North Hall',
    type: 'Single room',
    capacity: 1,
    status: 'Available',
    assignedTo: ''
  })

  // Fetch rooms from backend API if available
  useEffect(() => {
    let isMounted = true
    async function fetchRooms() {
      try {
        const res = await fetch('http://localhost:5000/api/rooms')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setRooms(data)
          }
        }
      } catch (err) {
        // Backend offline fallback
      }
    }
    fetchRooms()
    return () => { isMounted = false }
  }, [])

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (selectedBuilding !== 'All Buildings' && r.building !== selectedBuilding) return false
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = r.name.toLowerCase().includes(q)
        const matchBuilding = r.building.toLowerCase().includes(q)
        const matchType = r.type.toLowerCase().includes(q)
        const matchAssignee = r.assignedTo?.toLowerCase().includes(q)
        if (!matchName && !matchBuilding && !matchType && !matchAssignee) return false
      }
      return true
    })
  }, [rooms, selectedBuilding, selectedStatus, searchQuery])

  // Summary Metrics
  const stats = useMemo(() => {
    const available = rooms.filter(r => r.status === 'Available').length
    const occupied = rooms.filter(r => r.status === 'Occupied').length
    const reserved = rooms.filter(r => r.status === 'Reserved').length
    const maintenance = rooms.filter(r => r.status === 'Under maintenance').length
    return { total: rooms.length, available, occupied, reserved, maintenance }
  }, [rooms])

  // Generated room names preview for Add Rooms modal
  const generatedPreview = useMemo(() => {
    const qty = Math.max(1, Math.min(50, parseInt(formData.quantity) || 1))
    const startNum = parseInt(formData.startNumber) || 101
    const prefix = formData.namePrefix.trim()

    const names = []
    for (let i = 0; i < qty; i++) {
      names.push(`${prefix}${startNum + i}`)
    }
    return names
  }, [formData.namePrefix, formData.startNumber, formData.quantity])

  function openAddModal() {
    setFormData({
      namePrefix: 'Room A-',
      startNumber: 101,
      quantity: 1,
      building: 'North Hall',
      type: 'Single room',
      capacity: 1,
      status: 'Available',
      assignedTo: ''
    })
    setActiveModal('add')
  }

  function openEditModal(room) {
    setSelectedRoom(room)
    setEditFormData({
      name: room.name,
      building: room.building,
      type: room.type || 'Single room',
      capacity: room.capacity || 1,
      status: room.status || 'Available',
      assignedTo: room.assignedTo || ''
    })
    setActiveModal('edit')
  }

  async function handleAddRoomsSubmit(e) {
    e.preventDefault()
    if (!formData.namePrefix.trim()) return

    const qty = Math.max(1, Math.min(50, parseInt(formData.quantity) || 1))
    const newRoomsPayload = generatedPreview.map(nameStr => ({
      _id: 'rm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: nameStr,
      building: formData.building,
      type: formData.type,
      capacity: parseInt(formData.capacity) || 1,
      status: formData.status,
      assignedTo: formData.assignedTo
    }))

    try {
      const res = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoomsPayload)
      })
      if (res.ok) {
        const createdData = await res.json()
        const addedList = Array.isArray(createdData) ? createdData : [createdData]
        setRooms(prev => [...prev, ...addedList])
        setNotice(`Successfully added ${addedList.length} room(s) to ${formData.building}.`)
        setActiveModal(null)
        return
      }
    } catch (err) {}

    setRooms(prev => [...prev, ...newRoomsPayload])
    setNotice(`Successfully added ${newRoomsPayload.length} room(s) to ${formData.building}.`)
    setActiveModal(null)
  }

  async function handleEditRoomSubmit(e) {
    e.preventDefault()
    if (!selectedRoom || !editFormData.name.trim()) return

    const updated = { ...selectedRoom, ...editFormData }

    try {
      if (!selectedRoom._id.startsWith('rm-')) {
        await fetch(`http://localhost:5000/api/rooms/${selectedRoom._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        })
      }
    } catch (err) {}

    setRooms(prev => prev.map(r => r._id === selectedRoom._id ? updated : r))
    setNotice(`Updated room ${editFormData.name}.`)
    setActiveModal(null)
  }

  async function handleDeleteRoom(id, name) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      if (!id.startsWith('rm-')) {
        await fetch(`http://localhost:5000/api/rooms/${id}`, { method: 'DELETE' })
      }
    } catch (err) {}

    setRooms(prev => prev.filter(r => r._id !== id))
    setNotice(`Deleted room ${name}.`)
  }

  async function handleStatusChange(room, newStatus) {
    const updated = { ...room, status: newStatus }

    try {
      if (!room._id.startsWith('rm-')) {
        await fetch(`http://localhost:5000/api/rooms/${room._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      }
    } catch (err) {}

    setRooms(prev => prev.map(r => r._id === room._id ? updated : r))
    setNotice(`Updated status for ${room.name} to ${newStatus}.`)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto space-y-3 overflow-hidden">
      
      {/* Status Notice Toast */}
      {notice && (
        <div role="status" className="flex items-center justify-between rounded-lg bg-[#e2f5f1] px-4 py-2 text-xs font-bold text-[#087364] shadow-xs">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-[#087364] hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Full Height Card */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-[#0d8c7a]" />
              Campus Rooms Directory
            </h2>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 font-medium">
              <span>Total: <strong className="text-slate-900">{stats.total}</strong></span>
              <span className="text-emerald-600 font-bold">• {stats.available} Available</span>
              <span className="text-blue-600 font-bold">• {stats.occupied} Occupied</span>
              <span className="text-amber-600 font-bold">• {stats.reserved} Reserved</span>
            </div>
          </div>

          {/* Search, Filters & + Add Rooms Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search rooms..."
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

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]"
            >
              <option value="all">All Statuses</option>
              {ROOM_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Add Rooms Button */}
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d8c7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Add Rooms
            </button>

          </div>
        </div>

        {/* Rooms Table */}
        <div className="flex-1 overflow-auto min-h-0 mt-3">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5 font-bold">Room Name</th>
                <th className="px-4 py-2.5 font-bold">Building & Wing</th>
                <th className="px-4 py-2.5 font-bold">Type</th>
                <th className="px-4 py-2.5 font-bold">Capacity</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold">Occupant / Faculty</th>
                <th className="px-4 py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <DoorOpen className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-bold text-slate-600">No rooms found</p>
                    <p className="mt-1 text-[11px]">Try adjusting your search or filter options.</p>
                  </td>
                </tr>
              ) : (
                filteredRooms.map(room => {
                  const statusColors = {
                    Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Occupied: 'bg-blue-50 text-blue-700 border-blue-200',
                    Reserved: 'bg-amber-50 text-amber-700 border-amber-200',
                    'Under maintenance': 'bg-rose-50 text-rose-700 border-rose-200'
                  }

                  return (
                    <tr key={room._id} className="hover:bg-slate-50/70 transition text-slate-600">
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-100 p-1.5 text-[#0d8c7a]">
                            <DoorOpen className="h-4 w-4" />
                          </span>
                          {room.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          {room.building}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {room.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {room.capacity} person{room.capacity > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={room.status}
                          onChange={e => handleStatusChange(room, e.target.value)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border outline-none cursor-pointer ${statusColors[room.status] || 'bg-slate-100'}`}
                        >
                          {ROOM_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {room.assignedTo ? (
                          <span className="flex items-center gap-1 font-medium text-slate-800">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {room.assignedTo}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(room)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Edit room"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoom(room._id, room.name)}
                            className="rounded-md p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete room"
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
        </div>

      </div>

      {/* ADD ROOMS MODAL (SUPPORTS QUANTITY BY NAME PREFIX) */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#0d8c7a]" />
                  Add Campus Rooms
                </h3>
                <p className="text-[11px] text-slate-500">
                  Specify how many rooms to generate by name prefix and starting number
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoomsSubmit} className="mt-3 space-y-3">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700">Room Prefix *</label>
                  <input
                    type="text"
                    required
                    placeholder="Room A-"
                    value={formData.namePrefix}
                    onChange={e => setFormData({ ...formData, namePrefix: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Start Number *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.startNumber}
                    onChange={e => setFormData({ ...formData, startNumber: parseInt(e.target.value) || 101 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">How Many Rooms? *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#0d8c7a] outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              {/* Live Room Name Generation Preview */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#0d8c7a]" />
                  Generated Room List Preview ({generatedPreview.length} rooms):
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1 max-h-20 overflow-auto">
                  {generatedPreview.map((rName, idx) => (
                    <span key={rName + idx} className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                      {rName}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Building / Wing</label>
                  <select
                    value={formData.building}
                    onChange={e => setFormData({ ...formData, building: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {BUILDINGS.filter(b => b !== 'All Buildings').map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Room Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {ROOM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Capacity (Persons)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {ROOM_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Assign Occupant / Faculty (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Lee"
                  value={formData.assignedTo}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0d8c7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs"
                >
                  Add {generatedPreview.length} Room{generatedPreview.length > 1 ? 's' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SINGLE ROOM MODAL */}
      {activeModal === 'edit' && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-[#0d8c7a]" />
                Edit {selectedRoom.name}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditRoomSubmit} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Room Name / Number *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Building</label>
                  <select
                    value={editFormData.building}
                    onChange={e => setEditFormData({ ...editFormData, building: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {BUILDINGS.filter(b => b !== 'All Buildings').map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Room Type</label>
                  <select
                    value={editFormData.type}
                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {ROOM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={editFormData.capacity}
                    onChange={e => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {ROOM_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Assigned Occupant / Faculty</label>
                <input
                  type="text"
                  placeholder="Unassigned"
                  value={editFormData.assignedTo}
                  onChange={e => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0d8c7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs"
                >
                  Update Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
