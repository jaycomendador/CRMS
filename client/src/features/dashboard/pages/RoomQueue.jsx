import { useEffect, useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  Footprints,
  X
} from 'lucide-react'

const FLOOR_COLORS = [
  { header: 'bg-[#e8ab3c] text-white', bg: 'bg-[#fff8ea]', border: 'border-[#fde6b8]', text: 'text-[#9c6a16]' },
  { header: 'bg-[#5592e6] text-white', bg: 'bg-[#eaf3fc]', border: 'border-[#c2dcf8]', text: 'text-[#2e62ad]' },
  { header: 'bg-[#45a892] text-white', bg: 'bg-[#e8f7f3]', border: 'border-[#beebd9]', text: 'text-[#266e5e]' },
  { header: 'bg-[#8b78ca] text-white', bg: 'bg-[#f3f0f9]', border: 'border-[#d8cef2]', text: 'text-[#5d4a9c]' }
]

function getFloorLabel(level) {
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'
  return `${level}${suffix} Floor`
}

function normalizeRoomName(value) {
  return value?.replace(/^Room\s+/i, '').trim().toLowerCase()
}

function createBuildingsFromRooms(rooms, faculty) {
  const buildings = {}

  rooms.forEach(room => {
    if (!room.building || !room.name) return

    const floorLevel = Number(room.floor) || Number.parseInt(room.name, 10) || 1
    const building = buildings[room.building] || { floors: [] }
    let floor = building.floors.find(item => item.level === floorLevel)

    if (!floor) {
      floor = {
        level: floorLevel,
        label: getFloorLabel(floorLevel),
        color: FLOOR_COLORS[(floorLevel - 1) % FLOOR_COLORS.length],
        rooms: []
      }
      building.floors.push(floor)
    }

    floor.rooms.push({
      _id: room._id,
      id: room.name,
      type: room.type,
      status: room.status,
      capacity: room.capacity,
      assignedTo: faculty.find(member => (
        normalizeRoomName(member.assignedRoom) === normalizeRoomName(room.name) &&
        (!member.assignedBuilding || member.assignedBuilding === room.building)
      ))?.name || room.assignedTo || ''
    })
    buildings[room.building] = building
  })

  Object.values(buildings).forEach(building => {
    building.floors.sort((first, second) => second.level - first.level)
  })

  return buildings
}

export default function BuildingStructure() {
  const [buildings, setBuildings] = useState({})
  const [activeBuildingName, setActiveBuildingName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeModal, setActiveModal] = useState(false)
  const [notice, setNotice] = useState('')

  // Add Room Form State
  const [formData, setFormData] = useState({
    targetBuilding: '',
    targetLevel: 4,
    roomId: '',
    roomType: 'Classroom',
    capacity: 30,
    status: 'Available'
  })

  const currentBuilding = buildings[activeBuildingName]

  useEffect(() => {
    let isMounted = true

    async function loadRooms() {
      try {
        const [roomsResponse, facultyResponse] = await Promise.all([
          fetch('http://localhost:5000/api/rooms'),
          fetch('http://localhost:5000/api/faculty')
        ])
        if (!roomsResponse.ok) return

        const rooms = await roomsResponse.json()
        const faculty = facultyResponse.ok ? await facultyResponse.json() : []
        if (!isMounted || !Array.isArray(rooms)) return

        const nextBuildings = createBuildingsFromRooms(rooms, Array.isArray(faculty) ? faculty : [])
        setBuildings(nextBuildings)
        setActiveBuildingName(current => current && nextBuildings[current] ? current : Object.keys(nextBuildings)[0] || '')
        setFormData(current => ({
          ...current,
          targetBuilding: current.targetBuilding || Object.keys(nextBuildings)[0] || ''
        }))
      } catch {
        setNotice('Unable to load rooms from the database.')
      }
    }

    loadRooms()
    return () => { isMounted = false }
  }, [])

  // Handle reserve or status change
  async function handleToggleRoomStatus(levelIndex, roomId) {
    const room = currentBuilding?.floors[levelIndex]?.rooms.find(item => item.id === roomId)
    if (!room) return

    const nextStatus = room.status === 'Available' ? 'Reserved' : room.status === 'Reserved' ? 'Occupied' : 'Available'
    const nextAssignedTo = nextStatus === 'Available' ? '' : room.assignedTo

    if (room._id) {
      try {
        const response = await fetch(`http://localhost:5000/api/rooms/${room._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus, assignedTo: nextAssignedTo })
        })
        if (!response.ok) throw new Error('Status update failed')
        const historyResponse = await fetch('http://localhost:5000/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: room.id,
            building: activeBuildingName,
            person: room.assignedTo || 'Unassigned',
            action: 'Room Status Changed',
            status: nextStatus === 'Available' ? 'Returned' : 'Active',
            notes: `Status changed from ${room.status} to ${nextStatus}.`
          })
        })
        if (!historyResponse.ok) throw new Error('History update failed')
      } catch {
        setNotice('Unable to update room status in the database.')
        return
      }
    }

    setBuildings(prev => {
      const copy = JSON.parse(JSON.stringify(prev))
      const b = copy[activeBuildingName]
      if (b && b.floors[levelIndex]) {
        const r = b.floors[levelIndex].rooms.find(rm => rm.id === roomId)
        if (r && !r.isFacility) {
          r.status = nextStatus
          r.assignedTo = nextAssignedTo
          setNotice(`Updated ${r.id} status to ${r.status}.`)
        }
      }
      return copy
    })
    setSelectedRoom(null)
  }

  async function handleAddRoomSubmit(e) {
    e.preventDefault()
    if (!formData.roomId.trim() || !formData.targetBuilding.trim()) return

    const roomPayload = {
      name: formData.roomId.trim(),
      building: formData.targetBuilding.trim(),
      floor: parseInt(formData.targetLevel) || 1,
      type: formData.roomType,
      status: formData.status,
      capacity: parseInt(formData.capacity) || 1
    }

    let createdRoom
    try {
      const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomPayload)
      })
      if (!response.ok) throw new Error('Room creation failed')
      createdRoom = await response.json()
    } catch {
      setNotice('Unable to save the room to the database.')
      return
    }

    const newRoomObj = {
      _id: createdRoom._id,
      id: createdRoom.name,
      type: createdRoom.type,
      status: createdRoom.status,
      capacity: createdRoom.capacity
    }

    setBuildings(prev => {
      const copy = JSON.parse(JSON.stringify(prev))
      const buildingName = formData.targetBuilding.trim()
      const building = copy[buildingName] || { floors: [] }
      const levelNum = parseInt(formData.targetLevel) || 1
      let floorObj = building.floors.find(f => f.level === levelNum)

      if (!floorObj) {
        floorObj = {
          level: levelNum,
          label: getFloorLabel(levelNum),
          color: FLOOR_COLORS[(levelNum - 1) % FLOOR_COLORS.length],
          rooms: []
        }
        building.floors.push(floorObj)
        building.floors.sort((first, second) => second.level - first.level)
      }

      floorObj.rooms.push(newRoomObj)
      copy[buildingName] = building
      return copy
    })

    setActiveBuildingName(formData.targetBuilding.trim())
    setNotice(`Added room ${createdRoom.name} to ${formData.targetBuilding.trim()} and saved it.`)
    setActiveModal(false)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto overflow-hidden">
      
      {/* Notice Toast */}
      {notice && (
        <div role="status" className="flex items-center justify-between rounded-lg bg-[#e2f5f1] px-4 py-1.5 text-xs font-bold text-[#087364] shadow-xs mb-2 shrink-0">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-[#087364] hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Full Height Card (No Scrollbar Container) */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 shrink-0">
          
          {/* Building Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {Object.keys(buildings).map(bName => (
                <button
                  key={bName}
                  type="button"
                  onClick={() => setActiveBuildingName(bName)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg transition ${
                    activeBuildingName === bName ? 'bg-[#1e3a5f] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {bName}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Add Room Button */}
          <div className="flex items-center gap-2.5">
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-36 sm:w-44 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs outline-none focus:border-[#0d8c7a]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, targetBuilding: activeBuildingName }))
                setActiveModal(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d8c7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Room
            </button>

          </div>

        </div>

        {/* 3D MULTI-FLOOR STACKED BUILDING DIAGRAM (100% SCREEN FITTING, NO SCROLLBAR) */}
        <div className="flex-1 flex flex-col min-h-0 mt-2 p-2 bg-slate-100/70 rounded-xl border border-slate-200 overflow-hidden">
          
          <div className="flex-1 flex flex-col min-h-0 max-w-5xl w-full mx-auto shadow-sm rounded-xl overflow-hidden border border-[#1e3a5f]/20 bg-white">
            
            {/* Dark Blue Building Header Bar */}
            <div className="bg-[#1e3a5f] px-4 py-2 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1 bg-white/10 rounded-md">
                  <Building2 className="h-4 w-4 text-sky-300" />
                </span>
                <div>
                  <h1 className="text-sm font-black tracking-wide leading-tight">{activeBuildingName} - Room Structure</h1>
                  <p className="text-[10px] text-sky-200 font-medium leading-none">Architectural Floor Plan & Room Grid</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Reserved</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Occupied</span>
              </div>
            </div>

            {/* STACKED FLOOR ROWS (STRETCHED EVENLY TO FILL VIEWPORT) */}
            <div className="flex-1 flex flex-col min-h-0 divide-y divide-slate-200 overflow-hidden">
              
              {currentBuilding ? currentBuilding.floors.map((floor, floorIdx) => {
                const filteredFloorRooms = floor.rooms.filter(rm => {
                  if (!searchQuery.trim()) return true
                  return rm.id.toLowerCase().includes(searchQuery.toLowerCase()) || rm.type.toLowerCase().includes(searchQuery.toLowerCase())
                })

                return (
                  <div key={floor.label} className="flex-1 flex min-h-0 items-center overflow-hidden">
                    
                    {/* Left 3D Building Wall Graphic */}
                    <div className="w-14 sm:w-16 h-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 border-r border-slate-300 flex flex-col items-center justify-center p-1 shrink-0 shadow-inner relative">
                      <div className="flex gap-1">
                        <div className="h-5 w-2.5 bg-sky-100 border border-slate-400 rounded-xs shadow-inner" />
                        <div className="h-5 w-2.5 bg-sky-100 border border-slate-400 rounded-xs shadow-inner" />
                      </div>
                      <span className="mt-0.5 text-[8px] font-extrabold text-slate-600 uppercase tracking-tighter">L{floor.level} WALL</span>
                    </div>

                    {/* Floor Level Header Tag */}
                    <div className={`w-20 sm:w-24 h-full ${floor.color.header} flex flex-col justify-center items-center text-center p-1 font-black shrink-0 shadow-xs border-r border-white/20`}>
                      <span className="text-xs leading-none">{floor.label.split(' ')[0]}</span>
                      <span className="text-[10px] font-semibold opacity-90 mt-0.5 leading-none">{floor.label.split(' ')[1]}</span>
                    </div>

                    {/* Floor Rooms Row */}
                    <div className={`flex-1 h-full ${floor.color.bg} p-2 flex items-center gap-2 overflow-x-auto overflow-y-hidden`}>
                      
                      {filteredFloorRooms.length === 0 ? (
                        <p className="text-[11px] italic text-slate-400">No rooms on this floor.</p>
                      ) : (
                        filteredFloorRooms.map(room => {
                          const isFacility = room.isFacility
                          const isAvailable = room.status === 'Available'
                          const isReserved = room.status === 'Reserved'

                          return (
                            <div
                              key={room.id}
                              title={room.assignedTo ? `Instructor: ${room.assignedTo}` : 'No instructor assigned'}
                              onClick={() => !isFacility && setSelectedRoom({ room, floorIdx, floorLabel: floor.label })}
                              className={`group rounded-xl border-2 px-3 py-2 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col items-center justify-center min-w-[85px] sm:min-w-[110px] text-center shrink-0 ${
                                isFacility
                                  ? 'border-slate-300 bg-slate-50 opacity-80 cursor-default'
                                  : isAvailable
                                  ? 'border-emerald-300 hover:border-emerald-500'
                                  : isReserved
                                  ? 'border-amber-300 hover:border-amber-500'
                                  : 'border-slate-400 hover:border-slate-600'
                              }`}
                            >
                              <p className={`text-xs font-black tracking-tight ${isFacility ? 'text-slate-500 text-[11px] flex items-center gap-1' : 'text-slate-900'}`}>
                                {isFacility && <Footprints className="h-3 w-3 text-slate-400 shrink-0" />}
                                {room.id}
                              </p>
                              {!isFacility && (
                                <div className="mt-0.5 flex items-center justify-center gap-1">
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    isAvailable ? 'bg-emerald-500' : isReserved ? 'bg-amber-500' : 'bg-slate-700'
                                  }`} />
                                  <span className="text-[8px] font-bold text-slate-400 capitalize">{room.status}</span>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}

                    </div>

                  </div>
                )
              }) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center">
                  <p className="text-xs font-semibold text-slate-400">No rooms found in the database.</p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ADD ROOM MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#0d8c7a]" />
                Add Room Box to {formData.targetBuilding}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Building *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter the building name"
                  value={formData.targetBuilding}
                  onChange={e => setFormData({ ...formData, targetBuilding: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Floor Level</label>
                  <select
                    value={formData.targetLevel}
                    onChange={e => setFormData({ ...formData, targetLevel: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    <option value={4}>4th Floor</option>
                    <option value={3}>3rd Floor</option>
                    <option value={2}>2nd Floor</option>
                    <option value={1}>1st Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Room Name / ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 404 or lab5"
                    value={formData.roomId}
                    onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Room Type</label>
                  <select
                    value={formData.roomType}
                    onChange={e => setFormData({ ...formData, roomType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Multimedia Hall">Multimedia Hall</option>
                    <option value="Seminar Room">Seminar Room</option>
                    <option value="Single room">Single room</option>
                    <option value="Double room">Double room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Capacity (Persons)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0d8c7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs"
                >
                  Add Room Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM DETAILS POPUP */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#0d8c7a]" />
                Room {selectedRoom.room.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p><span className="font-bold text-slate-700">Floor:</span> {selectedRoom.floorLabel}</p>
              <p><span className="font-bold text-slate-700">Type:</span> {selectedRoom.room.type}</p>
              <p><span className="font-bold text-slate-700">Capacity:</span> {selectedRoom.room.capacity} Persons</p>
              <p><span className="font-bold text-slate-700">Instructor:</span> {selectedRoom.room.assignedTo || 'Unassigned'}</p>
              <p className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">Status:</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedRoom.room.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : selectedRoom.room.status === 'Reserved' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                }`}>
                  {selectedRoom.room.status}
                </span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleToggleRoomStatus(selectedRoom.floorIdx, selectedRoom.room.id)}
                className="w-full rounded-lg bg-[#0d8c7a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs"
              >
                Cycle Status ({selectedRoom.room.status === 'Available' ? 'Set Reserved' : selectedRoom.room.status === 'Reserved' ? 'Set Occupied' : 'Set Available'})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
