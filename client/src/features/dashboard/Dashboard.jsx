import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  DoorOpen,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Users,
  UserPlus,
  DoorClosed,
  CalendarClock,
  Wrench,
  X,
  History
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import AddFaculty from './pages/AddFaculty'
import Calendar from './pages/Calendar'
import FacultyMembers from './pages/FacultyMembers'
import Rooms from './pages/Rooms'
import RoomsTaken from './pages/RoomsTaken'
import RoomQueue from './pages/RoomQueue'
import RoomHistory from './pages/RoomHistory'
import SettingsPage from './pages/Settings'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Rooms', icon: DoorOpen },
  { label: 'Rooms taken', icon: DoorClosed },
  { label: 'Building structure', icon: Building2 },
  { label: 'Faculty members', icon: Users },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'History', icon: History },
  { label: 'Add faculty', icon: UserPlus },
  { label: 'Settings', icon: Settings },
]

const pageComponents = { Rooms, 'Rooms taken': RoomsTaken, 'Building structure': RoomQueue, 'Room queue': RoomQueue, Requests: Rooms, 'Faculty members': FacultyMembers, Calendar, History: RoomHistory, 'Room history': RoomHistory, 'Add faculty': AddFaculty, Settings: SettingsPage }

const requests = [
  { room: 'B-204', resident: 'Jordan Lee', detail: 'Desk lamp replacement', status: 'Open', tone: 'amber' },
  { room: 'A-118', resident: 'Maya Chen', detail: 'Air conditioning check', status: 'In progress', tone: 'blue' },
  { room: 'C-307', resident: 'Noah Williams', detail: 'Key card not working', status: 'Open', tone: 'amber' },
  { room: 'A-102', resident: 'Sofia Patel', detail: 'Move-in inspection', status: 'Scheduled', tone: 'green' },
]

function StatCard({ icon: Icon, label, value, detail, tone }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-lg p-2.5 ${colors[tone]}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
      </div>
    </article>
  )
}

function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="logout-dialog-title"
    >
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-rose-50 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
            <LogOut className="h-5 w-5 text-rose-600" aria-hidden="true" />
          </span>
          <div>
            <p id="logout-dialog-title" className="text-sm font-extrabold text-slate-900">Sign out</p>
            <p className="text-xs text-slate-500">College Room Management System</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            Are you sure you want to <span className="font-bold text-rose-600">log out</span>? You will be redirected to the sign-in page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition focus:outline-none focus:ring-4 focus:ring-rose-600/20"
          >
            Yes, log out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ staff, onLogout }) {
  const [activeItem, setActiveItem] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const organizationName = staff?.organizationName || 'Campus Residence'
  const ActivePage = pageComponents[activeItem]

  // ── Shared Faculty State (lifted so AddFaculty & FacultyMembers stay in sync) ──
  const [facultyList, setFacultyList] = useState([])
  const [facultyLoading, setFacultyLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function fetchFaculty() {
      try {
        const res = await fetch('http://localhost:5000/api/faculty')
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setFacultyList(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        // server offline – list stays empty
      } finally {
        if (isMounted) setFacultyLoading(false)
      }
    }
    fetchFaculty()
    return () => { isMounted = false }
  }, [])

  // Called by AddFaculty after a successful save – prepend new member and switch tab
  function handleFacultyAdded(newFaculty) {
    setFacultyList(prev => [newFaculty, ...prev])
    setActiveItem('Faculty members')
  }

  return (
    <div className="flex h-full min-h-0 bg-[#f5f7fb] text-slate-900">
      {sidebarOpen && <button aria-label="Close navigation" type="button" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <img src="/logo.png" alt="College Room Management System logo" className="h-11 w-11 object-contain" />
          <div><p className="text-sm font-bold leading-tight text-[#12354a]">College Room</p><p className="text-sm font-bold leading-tight text-[#12354a]">Management System</p></div>
          <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"><X aria-hidden="true" className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Dashboard navigation">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} type="button" onClick={() => { setActiveItem(label); setSidebarOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeItem === label ? 'bg-[#0d8c7a] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />{label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <button type="button" onClick={() => setShowLogoutModal(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut aria-hidden="true" className="h-[18px] w-[18px]" />Log out</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3"><button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu aria-hidden="true" className="h-5 w-5" /></button><div><p className="text-xs font-semibold text-slate-400">Workspace</p><h1 className="text-lg font-bold text-slate-900">Dashboard</h1></div></div>
          <div className="hidden items-center gap-3 md:flex"><div className="relative"><Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="Search dashboard" placeholder="Search rooms or residents" className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#0d8c7a]" /></div><button type="button" aria-label="View notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Bell aria-hidden="true" className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" /></button><div className="flex items-center gap-2 border-l border-slate-200 pl-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9f1ed] text-xs font-bold text-[#087364]">{organizationName.slice(0, 2).toUpperCase()}</span><div className="hidden xl:block"><p className="max-w-36 truncate text-xs font-bold text-slate-800">{organizationName}</p><p className="text-[10px] text-slate-400">Staff administrator</p></div><ChevronDown aria-hidden="true" className="h-4 w-4 text-slate-400" /></div></div>
        </header>

        <main className={`dashboard-content flex-1 min-h-0 ${activeItem === 'Dashboard' ? 'overflow-auto p-4 sm:p-6 lg:p-8' : 'flex flex-col overflow-hidden p-3 sm:p-4'}`}>
          {activeItem !== 'Dashboard' && ActivePage ? (
            activeItem === 'Faculty members' ? (
              <FacultyMembers
                facultyList={facultyList}
                setFacultyList={setFacultyList}
                isLoading={facultyLoading}
              />
            ) : activeItem === 'Add faculty' ? (
              <AddFaculty onFacultyAdded={handleFacultyAdded} />
            ) : (
              <ActivePage />
            )
          ) : null}
          {activeItem === 'Dashboard' ? (
          <div className="mx-auto max-w-7xl space-y-6">
            <section className="relative overflow-hidden rounded-2xl bg-[#e8f3ff] px-6 py-7 sm:px-8"><div className="relative z-10 max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d8c7a]">{organizationName}</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Good morning, staff team.</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Here is the latest view of rooms, residents, and maintenance activity across your campus.</p><button type="button" onClick={() => setActiveItem('Rooms')} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0d8c7a] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#087364]"><DoorOpen aria-hidden="true" className="h-4 w-4" />View rooms</button></div><Building2 aria-hidden="true" className="absolute -right-4 -bottom-8 h-48 w-48 text-[#cfe5fb]" /></section>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={DoorOpen} label="Total rooms" value="128" detail="Across 4 buildings" tone="blue" /><StatCard icon={Users} label="Occupied rooms" value="112" detail="87.5% occupancy" tone="green" /><StatCard icon={ClipboardList} label="Open requests" value="18" detail="4 need attention" tone="amber" /><StatCard icon={Wrench} label="Maintenance" value="06" detail="Scheduled this week" tone="rose" /></section>
            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900">Recent room requests</h3><p className="mt-1 text-xs text-slate-500">The latest activity from residents</p></div><button type="button" onClick={() => setActiveItem('Requests')} className="text-xs font-bold text-[#0d8c7a] hover:underline">View all</button></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-bold">Room</th><th className="px-5 py-3 font-bold">Resident</th><th className="px-5 py-3 font-bold">Request</th><th className="px-5 py-3 font-bold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.map((request) => <tr key={`${request.room}-${request.resident}`} className="text-slate-600"><td className="px-5 py-3.5 font-bold text-slate-900">{request.room}</td><td className="px-5 py-3.5">{request.resident}</td><td className="px-5 py-3.5">{request.detail}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${request.tone === 'amber' ? 'bg-amber-50 text-amber-700' : request.tone === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{request.status}</span></td></tr>)}</tbody></table></div></article>
              <article className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900">Notice board</h3><p className="mt-1 text-xs text-slate-500">Important campus updates</p></div><Bell aria-hidden="true" className="h-4 w-4 text-[#0d8c7a]" /></div><div className="divide-y divide-slate-100">{['End-of-term room inspections begin 25 May.', 'New maintenance schedule is available.', 'Resident move-in briefing is next Monday.'].map((notice, index) => <div key={notice} className="flex gap-3 px-5 py-4"><span className="rounded-lg bg-[#e2f5f1] p-2 text-[#0d8c7a]"><Bell aria-hidden="true" className="h-4 w-4" /></span><div><p className="text-xs font-bold text-slate-800">{notice}</p><p className="mt-1 text-[10px] text-slate-400">{index + 1} day{index ? 's' : ''} ago</p></div></div>)}</div></article>
            </section>
            <section className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Home aria-hidden="true" className="h-4 w-4 text-[#0d8c7a]" /><h3 className="text-sm font-bold">Room availability</h3></div><div className="mt-5 flex items-center gap-5"><div className="relative h-24 w-24 rounded-full" style={{ background: 'conic-gradient(#0d8c7a 0 87.5%, #e2f5f1 87.5% 100%)' }}><div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-lg font-bold text-slate-900">87%</div></div><div className="space-y-2 text-xs"><p className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full bg-[#0d8c7a]" />Occupied 112</p><p className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full bg-[#d9f1ed]" />Available 16</p></div></div></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="h-4 w-4 text-[#0d8c7a]" /><h3 className="text-sm font-bold">Upcoming</h3></div><p className="mt-5 text-2xl font-bold text-slate-900">25 <span className="text-sm font-semibold text-slate-400">May 2024</span></p><p className="mt-2 text-xs text-slate-500">Building inspection day</p><button type="button" onClick={() => setActiveItem('Calendar')} className="mt-4 text-xs font-bold text-[#0d8c7a] hover:underline">Open calendar</button></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><MessageSquare aria-hidden="true" className="h-4 w-4 text-[#0d8c7a]" /><h3 className="text-sm font-bold">Team inbox</h3></div><p className="mt-5 text-2xl font-bold text-slate-900">12 <span className="text-sm font-semibold text-slate-400">unread</span></p><p className="mt-2 text-xs text-slate-500">Messages from residents and staff</p><button type="button" onClick={() => setActiveItem('Messages')} className="mt-4 text-xs font-bold text-[#0d8c7a] hover:underline">Open messages</button></article></section>
          </div>
          ) : null}
        </main>
      </div>
      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={onLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  )
}
