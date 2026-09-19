import { useEffect, useState } from 'react'
import { Building2, CalendarDays, DoorOpen, LogOut, Users, Wrench } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function AdminDashboard({ admin, onLogout }) {
  const [data, setData] = useState({ rooms: [], faculty: [], events: [] })
  useEffect(() => {
    Promise.all(['rooms', 'faculty', 'events'].map(resource => fetch(`${API_URL}/${resource}`).then(response => response.ok ? response.json() : [])))
      .then(([rooms, faculty, events]) => setData({ rooms, faculty, events }))
      .catch(() => setData({ rooms: [], faculty: [], events: [] }))
  }, [])
  const occupied = data.rooms.filter(room => room.status === 'Occupied').length
  const activeEvents = data.events.filter(event => !['Completed', 'Cancelled'].includes(event.status)).length
  const cards = [
    ['Rooms managed', data.rooms.length, DoorOpen, 'text-blue-600 bg-blue-50'],
    ['Occupied now', occupied, Building2, 'text-emerald-600 bg-emerald-50'],
    ['Faculty members', data.faculty.length, Users, 'text-violet-600 bg-violet-50'],
    ['Active events', activeEvents, CalendarDays, 'text-amber-600 bg-amber-50']
  ]
  return <div className="h-dvh overflow-y-auto bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#087c70] text-white"><Building2 className="h-5 w-5" /></span><div><h1 className="font-extrabold">CRMS Command Center</h1><p className="text-xs text-slate-500">{admin.organizationName}</p></div></div><button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"><LogOut className="h-4 w-4" />Sign out</button></div></header>
    <main className="mx-auto max-w-7xl px-5 py-8"><section className="rounded-2xl bg-gradient-to-r from-[#075d55] to-[#102b48] px-6 py-8 text-white"><p className="text-sm font-bold text-teal-200">ADMINISTRATOR OVERVIEW</p><h2 className="mt-2 text-3xl font-black">Good day, {admin.name}.</h2><p className="mt-2 max-w-xl text-sm text-teal-50/80">Here is the current operational view of your CRMS campus.</p></section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon, style]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-lg ${style}`}><Icon className="h-5 w-5" /></span><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></article>)}</section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">Room availability</h3><p className="mt-1 text-sm text-slate-500">A snapshot of campus capacity.</p><div className="mt-6 flex items-center gap-5"><div className="text-4xl font-black text-[#087c70]">{data.rooms.length ? Math.round(((data.rooms.length - occupied) / data.rooms.length) * 100) : 0}%</div><div className="text-sm text-slate-500"><p><b className="text-slate-900">{data.rooms.length - occupied}</b> available rooms</p><p className="mt-1"><b className="text-slate-900">{occupied}</b> occupied rooms</p></div></div></article><article className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-amber-600" /><h3 className="font-extrabold">Upcoming campus activity</h3></div><div className="mt-4 space-y-3">{data.events.slice(0, 3).map(event => <div key={event._id} className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-sm font-bold">{event.title}</p><p className="text-xs text-slate-500">{event.date} {event.room ? `• ${event.room}` : ''}</p></div>)}{!data.events.length && <p className="text-sm text-slate-400">No events scheduled yet.</p>}</div></article></section>
    </main>
  </div>
}
