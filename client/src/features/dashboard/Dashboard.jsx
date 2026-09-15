import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  DoorClosed,
  DoorOpen,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  UserPlus,
  Users,
  Wrench,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Plays a pleasant two-tone chime using the Web Audio API (no external file needed)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.28, ctx.currentTime)
    masterGain.connect(ctx.destination)

    const notes = [
      { freq: 880, start: 0,    dur: 0.18 },
      { freq: 1108, start: 0.16, dur: 0.22 }
    ]

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.connect(gain)
      gain.connect(masterGain)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    })

    setTimeout(() => ctx.close(), 800)
  } catch {
    // silently fail if AudioContext is unavailable
  }
}
import AddFaculty from './pages/AddFaculty'
import Calendar from './pages/Calendar'
import FacultyMembers from './pages/FacultyMembers'
import Rooms from './pages/Rooms'
import RoomsTaken from './pages/RoomsTaken'
import RoomQueue from './pages/RoomQueue'
import RoomHistory from './pages/RoomHistory'
import SettingsPage from './pages/Settings'
import ChatModal from './ChatModal'
import { useDashboardSettings } from './settings'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Rooms', icon: DoorOpen },
  { label: 'Rooms taken', icon: DoorClosed },
  { label: 'Building structure', icon: Building2 },
  { label: 'Faculty members', icon: Users },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'History', icon: History },
  { label: 'Add faculty', icon: UserPlus },
  { label: 'Settings', icon: Settings }
]

const pageComponents = {
  Rooms,
  'Rooms taken': RoomsTaken,
  'Building structure': RoomQueue,
  'Room queue': RoomQueue,
  Requests: Rooms,
  'Faculty members': FacultyMembers,
  Calendar,
  History: RoomHistory,
  'Room history': RoomHistory,
  'Add faculty': AddFaculty,
  Settings: SettingsPage
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-lg p-2.5 ${colors[tone]}`}><Icon className="h-5 w-5" /></span>
      </div>
    </article>
  )
}

function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm" aria-modal="true" role="dialog" aria-labelledby="logout-dialog-title">
      <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-rose-50 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100"><LogOut className="h-5 w-5 text-rose-600" /></span><div><p id="logout-dialog-title" className="text-sm font-extrabold text-slate-900">Sign out</p><p className="text-xs text-slate-500">College Room Management System</p></div></div>
        <div className="px-5 py-5"><p className="text-sm leading-relaxed text-slate-700">Are you sure you want to <span className="font-bold text-rose-600">log out</span>? You will be redirected to the sign-in page.</p></div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3"><button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">Cancel</button><button type="button" onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Yes, log out</button></div>
      </div>
    </div>
  )
}

function formatEventDate(event) {
  if (!event?.date) return 'No scheduled date'
  return new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function DashboardHome({ organizationName, setActiveItem }) {
  const [data, setData] = useState({ rooms: [], events: [], history: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      try {
        const responses = await Promise.all([
          fetch('http://localhost:5000/api/rooms'),
          fetch('http://localhost:5000/api/events'),
          fetch('http://localhost:5000/api/history')
        ])
        const values = await Promise.all(responses.map(response => response.ok ? response.json() : []))
        if (isMounted) setData({
          rooms: Array.isArray(values[0]) ? values[0] : [],
          events: Array.isArray(values[1]) ? values[1] : [],
          history: Array.isArray(values[2]) ? values[2] : []
        })
      } catch {
        if (isMounted) setData({ rooms: [], events: [], history: [] })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardData()
    return () => { isMounted = false }
  }, [])

  const totalRooms = data.rooms.length
  const occupiedRooms = data.rooms.filter(room => room.status === 'Occupied').length
  const availableRooms = data.rooms.filter(room => room.status === 'Available').length
  const buildingCount = new Set(data.rooms.map(room => room.building).filter(Boolean)).size
  const activeHistory = data.history.filter(entry => entry.status === 'Active')
  const maintenanceCount = data.events.filter(event => event.category === 'Maintenance' && !['Completed', 'Cancelled'].includes(event.status)).length
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  const upcomingEvent = [...data.events].sort((first, second) => `${first.date} ${first.startTime}`.localeCompare(`${second.date} ${second.startTime}`))[0]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#e8f3ff] px-6 py-7 sm:px-8"><div className="relative z-10 max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d8c7a]">{organizationName}</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Good morning, staff team.</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Here is the latest view of rooms, residents, and maintenance activity across your campus.</p><button type="button" onClick={() => setActiveItem('Rooms')} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0d8c7a] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#087364]"><DoorOpen className="h-4 w-4" />View rooms</button></div><Building2 className="absolute -bottom-8 -right-4 h-48 w-48 text-[#cfe5fb]" /></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={DoorOpen} label="Total rooms" value={isLoading ? '...' : totalRooms} detail={`Across ${buildingCount} building${buildingCount === 1 ? '' : 's'}`} tone="blue" /><StatCard icon={Users} label="Occupied rooms" value={isLoading ? '...' : occupiedRooms} detail={`${occupancyRate}% occupancy`} tone="green" /><StatCard icon={ClipboardList} label="Open requests" value={isLoading ? '...' : activeHistory.length} detail="Active history records" tone="amber" /><StatCard icon={Wrench} label="Maintenance" value={isLoading ? '...' : maintenanceCount} detail="Active scheduled events" tone="rose" /></section>
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900">Recent room activity</h3><p className="mt-1 text-xs text-slate-500">The latest records from the database</p></div><button type="button" onClick={() => setActiveItem('History')} className="text-xs font-bold text-[#0d8c7a] hover:underline">View all</button></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3 font-bold">Room</th><th className="px-5 py-3 font-bold">Person</th><th className="px-5 py-3 font-bold">Activity</th><th className="px-5 py-3 font-bold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.history.length ? data.history.slice(0, 4).map(entry => <tr key={entry._id} className="text-slate-600"><td className="px-5 py-3.5 font-bold text-slate-900">{entry.room}</td><td className="px-5 py-3.5">{entry.person}</td><td className="px-5 py-3.5">{entry.action}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${entry.status === 'Active' ? 'bg-amber-50 text-amber-700' : entry.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{entry.status}</span></td></tr>) : <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-400">No room activity recorded.</td></tr>}</tbody></table></div></article>
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900">Notice board</h3><p className="mt-1 text-xs text-slate-500">Upcoming events from the database</p></div><Bell className="h-4 w-4 text-[#0d8c7a]" /></div><div className="divide-y divide-slate-100">{data.events.length ? data.events.slice(0, 3).map(event => <div key={event._id} className="flex gap-3 px-5 py-4"><span className="rounded-lg bg-[#e2f5f1] p-2 text-[#0d8c7a]"><Bell className="h-4 w-4" /></span><div><p className="text-xs font-bold text-slate-800">{event.title}</p><p className="mt-1 text-[10px] text-slate-400">{formatEventDate(event)}{event.room ? ` · ${event.room}` : ''}</p></div></div>) : <p className="px-5 py-8 text-center text-xs text-slate-400">No events recorded.</p>}</div></article>
      </section>
      <section className="grid gap-6 lg:grid-cols-3"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Home className="h-4 w-4 text-[#0d8c7a]" /><h3 className="text-sm font-bold">Room availability</h3></div><div className="mt-5 flex items-center gap-5"><div className="relative h-24 w-24 rounded-full" style={{ background: `conic-gradient(#0d8c7a 0 ${occupancyRate}%, #e2f5f1 ${occupancyRate}% 100%)` }}><div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-lg font-bold text-slate-900">{occupancyRate}%</div></div><div className="space-y-2 text-xs"><p className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full bg-[#0d8c7a]" />Occupied {occupiedRooms}</p><p className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full bg-[#d9f1ed]" />Available {availableRooms}</p></div></div></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#0d8c7a]" /><h3 className="text-sm font-bold">Upcoming</h3></div><p className="mt-5 text-2xl font-bold text-slate-900">{upcomingEvent ? formatEventDate(upcomingEvent) : 'No events'}</p><p className="mt-2 text-xs text-slate-500">{upcomingEvent?.title || 'Create an event to see it here.'}</p><button type="button" onClick={() => setActiveItem('Calendar')} className="mt-4 text-xs font-bold text-[#0d8c7a] hover:underline">Open calendar</button></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#0d8c7a]" /><h3 className="text-sm font-bold">Active records</h3></div><p className="mt-5 text-2xl font-bold text-slate-900">{activeHistory.length}</p><p className="mt-2 text-xs text-slate-500">Active room history records</p><button type="button" onClick={() => setActiveItem('History')} className="mt-4 text-xs font-bold text-[#0d8c7a] hover:underline">Open history</button></article></section>
    </div>
  )
}

export default function Dashboard({ staff, onLogout }) {
  const [activeItem, setActiveItem] = useState(() => {
    try {
      const savedPage = sessionStorage.getItem('crms_dashboard_active_page')
      return navigation.some(item => item.label === savedPage) ? savedPage : 'Dashboard'
    } catch {
      return 'Dashboard'
    }
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [notifEvents, setNotifEvents] = useState([])
  const [toasts, setToasts] = useState([])
  const prevEventIdsRef = useRef(null)
  const prevEventCountRef = useRef(0)
  const [headerSearch, setHeaderSearch] = useState(() => {
    try {
      return sessionStorage.getItem('crms_room_search') || ''
    } catch {
      return ''
    }
  })
  const [facultyList, setFacultyList] = useState([])
  const [facultyLoading, setFacultyLoading] = useState(true)
  const organizationName = staff?.organizationName || 'Campus Residence'
  const ActivePage = pageComponents[activeItem]
  const dashboardSettings = useDashboardSettings()

  useEffect(() => {
    try {
      sessionStorage.setItem('crms_dashboard_active_page', activeItem)
    } catch {}
  }, [activeItem])

  // Poll events for the notification badge, sound & toast
  useEffect(() => {
    let isMounted = true
    async function fetchEvents() {
      try {
        const res = await fetch('http://localhost:5000/api/events')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data)) {
            const active = data.filter(e => !['Completed', 'Cancelled'].includes(e.status))
            const activeIds = new Set(active.map(e => e._id))

            if (prevEventIdsRef.current !== null) {
              // Find genuinely new events since last poll
              const newEvents = active.filter(e => !prevEventIdsRef.current.has(e._id))
              if (dashboardSettings.roomStatusAlerts && newEvents.length > 0) {
                playNotificationSound()
                // Show a toast for each new event (max 3 at once)
                newEvents.slice(0, 3).forEach((evt, i) => {
                  const id = `toast-${evt._id}-${Date.now()}-${i}`
                  setToasts(prev => [...prev, { id, event: evt }])
                  setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== id))
                  }, 5000)
                })
              }
            }

            prevEventIdsRef.current = activeIds
            prevEventCountRef.current = active.length
            setNotifEvents(active)
          }
        }
      } catch {}
    }
    fetchEvents()
    const timer = setInterval(fetchEvents, 15000)
    return () => { isMounted = false; clearInterval(timer) }
  }, [dashboardSettings.roomStatusAlerts])

  useEffect(() => {
    let isMounted = true
    fetch('http://localhost:5000/api/faculty')
      .then(response => response.ok ? response.json() : [])
      .then(data => { if (isMounted) setFacultyList(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => { if (isMounted) setFacultyLoading(false) })
    return () => { isMounted = false }
  }, [])

  function handleFacultyAdded(newFaculty) {
    setFacultyList(prev => [newFaculty, ...prev])
    setActiveItem('Faculty members')
  }

  function handleHeaderSearch(event) {
    if (event.key !== 'Enter') return
    try {
      sessionStorage.setItem('crms_room_search', headerSearch)
    } catch {}
    setShowNotifications(false)
    setShowProfileMenu(false)
    setActiveItem('Rooms')
  }

  return (
    <div className="flex h-full min-h-0 bg-[#f5f7fb] text-slate-900">
      {sidebarOpen && <button aria-label="Close navigation" type="button" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6"><img src="/logo.png" alt="College Room Management System logo" className="h-11 w-11 object-contain" /><div><p className="sidebar-brand-text text-sm font-bold leading-tight text-[#12354a]">College Room</p><p className="sidebar-brand-text text-sm font-bold leading-tight text-[#12354a]">Management System</p></div><button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"><X className="h-5 w-5" /></button></div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Dashboard navigation"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>{navigation.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => { setActiveItem(label); setSidebarOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${activeItem === label ? 'bg-[#0d8c7a] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="h-[18px] w-[18px]" />{label}</button>)}</nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold text-slate-400">Workspace</p>
              <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Instructor Chat Bot Button */}
            <button
              type="button"
              aria-label="Instructor Chat Bot"
              title="Instructor Communication Bot"
              onClick={() => {
                setShowChatModal(true)
                setShowNotifications(false)
                setShowProfileMenu(false)
              }}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#0d8c7a] transition"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d8c7a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d8c7a]"></span>
              </span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                aria-label="View notifications"
                aria-expanded={showNotifications}
                onClick={() => {
                  const opening = !showNotifications
                  if (opening && dashboardSettings.roomStatusAlerts && notifEvents.length > 0) playNotificationSound()
                  setShowNotifications(opening)
                  setShowProfileMenu(false)
                }}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
              >
                <Bell className="h-5 w-5" />
                {dashboardSettings.roomStatusAlerts && notifEvents.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                    {notifEvents.length > 9 ? '9+' : notifEvents.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-11 z-40 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <span className="rounded-full bg-[#e2f5f1] px-2 py-1 text-[10px] font-bold text-[#087364]">
                      {dashboardSettings.roomStatusAlerts ? 'Alerts on' : 'Alerts off'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Room status alerts are {dashboardSettings.roomStatusAlerts ? 'enabled' : 'disabled'} for automatic updates.
                  </p>
                  {notifEvents.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      {notifEvents.slice(0, 3).map(evt => (
                        <div key={evt._id} className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                          <Bell className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{evt.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{evt.date}{evt.room ? ` · ${evt.room}` : ''}</p>
                          </div>
                        </div>
                      ))}
                      {notifEvents.length > 3 && (
                        <p className="text-[10px] font-bold text-slate-400 text-center">+{notifEvents.length - 3} more events</p>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => { setActiveItem('Settings'); setShowNotifications(false) }} className="flex-1 rounded-lg bg-[#0d8c7a] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#087364]">Notification settings</button>
                    <button type="button" onClick={() => { setActiveItem('History'); setShowNotifications(false) }} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">History</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
              <button
                type="button"
                aria-label="Open account menu"
                aria-expanded={showProfileMenu}
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2 rounded-lg p-1 text-left hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9f1ed] text-xs font-bold text-[#087364]">
                  {organizationName.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden xl:block">
                  <span className="block max-w-36 truncate text-xs font-bold text-slate-800">{organizationName}</span>
                  <span className="block text-[10px] text-slate-400">Staff administrator</span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <p className="text-sm font-bold text-slate-900">{organizationName}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{staff?.email || 'Staff administrator'}</p>
                  <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => { setActiveItem('Settings'); setShowProfileMenu(false) }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50">Account settings</button>
                    <button type="button" onClick={() => { setShowLogoutModal(true); setShowProfileMenu(false) }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50">Log out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`dashboard-content flex-1 min-h-0 ${activeItem === 'Dashboard' ? 'overflow-auto p-4 sm:p-6 lg:p-8' : activeItem === 'Settings' ? 'overflow-auto p-3 sm:p-4' : 'flex flex-col overflow-hidden p-3 sm:p-4'}`}>
          {activeItem === 'Dashboard' ? <DashboardHome organizationName={organizationName} setActiveItem={setActiveItem} /> : activeItem === 'Faculty members' ? <FacultyMembers facultyList={facultyList} setFacultyList={setFacultyList} isLoading={facultyLoading} /> : activeItem === 'Add faculty' ? <AddFaculty onFacultyAdded={handleFacultyAdded} /> : activeItem === 'Rooms taken' ? <RoomsTaken onDone={() => setActiveItem('History')} /> : activeItem === 'Settings' ? <SettingsPage staff={staff} onLogout={() => setShowLogoutModal(true)} /> : ActivePage ? <ActivePage /> : null}
        </main>
      </div>
      {showLogoutModal && <LogoutConfirmModal onConfirm={onLogout} onCancel={() => setShowLogoutModal(false)} />}

      {/* Instructor Chat Bot Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        facultyList={facultyList}
        currentUser={staff}
      />

      {/* Toast notifications — auto-appear when new events arrive */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-2xl ring-1 ring-amber-100 animate-slide-in-right w-80"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Bell className="h-4 w-4 text-amber-600" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900">New event scheduled</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700 truncate">{toast.event.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{toast.event.date}{toast.event.room ? ` · ${toast.event.room}` : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
