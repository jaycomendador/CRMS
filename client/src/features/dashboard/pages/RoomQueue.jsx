import { useState } from 'react'
import { CalendarClock, CheckCircle2, Clock3, DoorOpen, ListPlus } from 'lucide-react'
import DashboardPage from '../DashboardPage'

const initialRooms = [
  { id: 'A-102', building: 'North Hall', type: 'Single room', status: 'Available', reservedUntil: 'Available now', nextAvailable: 'Today, 2:00 PM', queue: 0 },
  { id: 'B-204', building: 'West Residence', type: 'Double room', status: 'Reserved', reservedUntil: 'Today, 5:30 PM', nextAvailable: 'Today, 5:30 PM', queue: 3 },
  { id: 'C-307', building: 'Central Hall', type: 'Single room', status: 'Occupied', reservedUntil: 'Tomorrow, 10:00 AM', nextAvailable: 'Tomorrow, 10:00 AM', queue: 5 },
  { id: 'D-118', building: 'South Hall', type: 'Faculty suite', status: 'Available', reservedUntil: 'Available now', nextAvailable: 'Today, 3:30 PM', queue: 1 },
]

export default function RoomQueue() {
  const [rooms, setRooms] = useState(initialRooms)
  const [notice, setNotice] = useState('')

  function joinQueue(roomId) {
    setRooms((currentRooms) => currentRooms.map((room) => room.id === roomId ? { ...room, queue: room.queue + 1 } : room))
    setNotice(`Added to the queue for room ${roomId}.`)
  }

  function reserveRoom(roomId) {
    setRooms((currentRooms) => currentRooms.map((room) => room.id === roomId ? { ...room, status: 'Reserved', reservedUntil: 'Reserved for today', queue: 0 } : room))
    setNotice(`Room ${roomId} has been reserved.`)
  }

  return (
    <DashboardPage icon={CalendarClock} title="Room queue" description="Track availability, reservation windows, and the waiting queue for each room.">
      {notice && <div role="status" className="rounded-lg bg-[#e2f5f1] px-4 py-3 text-xs font-bold text-[#087364]">{notice}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Available now</p><p className="mt-2 text-2xl font-bold text-emerald-600">{rooms.filter((room) => room.status === 'Available').length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Reserved</p><p className="mt-2 text-2xl font-bold text-blue-600">{rooms.filter((room) => room.status === 'Reserved').length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">Occupied</p><p className="mt-2 text-2xl font-bold text-slate-700">{rooms.filter((room) => room.status === 'Occupied').length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">People waiting</p><p className="mt-2 text-2xl font-bold text-amber-600">{rooms.reduce((total, room) => total + room.queue, 0)}</p></div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-900">Availability and reservations</h3><p className="mt-1 text-xs text-slate-500">Reserve an available room or join its queue</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-bold">Room</th><th className="px-5 py-3 font-bold">Building</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 font-bold">Reserved until</th><th className="px-5 py-3 font-bold">Next available</th><th className="px-5 py-3 font-bold">Queue</th><th className="px-5 py-3 font-bold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{rooms.map((room) => <tr key={room.id} className="text-slate-600"><td className="px-5 py-4"><div className="flex items-center gap-2 font-bold text-slate-900"><DoorOpen aria-hidden="true" className="h-4 w-4 text-[#0d8c7a]" />{room.id}</div><p className="ml-6 mt-1 text-[10px] text-slate-400">{room.type}</p></td><td className="px-5 py-4">{room.building}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${room.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : room.status === 'Reserved' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{room.status}</span></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />{room.reservedUntil}</span></td><td className="px-5 py-4">{room.nextAvailable}</td><td className="px-5 py-4"><span className="font-bold text-slate-900">{room.queue}</span> <span className="text-slate-400">waiting</span></td><td className="px-5 py-4">{room.status === 'Available' ? <button type="button" onClick={() => reserveRoom(room.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d8c7a] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#087364]"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />Reserve</button> : <button type="button" onClick={() => joinQueue(room.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0d8c7a] px-3 py-2 text-[10px] font-bold text-[#0d8c7a] hover:bg-[#e2f5f1]"><ListPlus aria-hidden="true" className="h-3.5 w-3.5" />Join queue</button>}</td></tr>)}</tbody></table></div></div>
    </DashboardPage>
  )
}
