import { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Wrench,
  DoorOpen,
  ClipboardList,
  Sparkles,
  BookmarkCheck,
  X,
  Edit2,
  Trash2,
  CalendarDays,
  Tag,
  FileText
} from 'lucide-react'

// Helper to format date strings YYYY-MM-DD
function formatDateKey(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getInitialEvents() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const format = (dayOffset, monthOffset = 0) => {
    const d = new Date(year, month + monthOffset, today.getDate() + dayOffset)
    return formatDateKey(d)
  }

  return [
    {
      _id: 'evt-1',
      title: 'End-of-Term Room Inspections',
      category: 'Inspection',
      date: format(0),
      startTime: '09:00',
      endTime: '11:30',
      room: 'Building A (Rooms 101-115)',
      assignedTo: 'Officer Marcus Vance',
      status: 'Scheduled',
      notes: 'Check smoke detectors, window seals, and room safety equipment.'
    },
    {
      _id: 'evt-2',
      title: 'Air Conditioner Repair',
      category: 'Maintenance',
      date: format(0),
      startTime: '13:00',
      endTime: '14:30',
      room: 'B-204',
      assignedTo: 'Tech Alex Rivera',
      status: 'In progress',
      notes: 'Replace filter and inspect compressor unit.'
    },
    {
      _id: 'evt-3',
      title: 'New Student Resident Move-In',
      category: 'Move-in',
      date: format(1),
      startTime: '08:30',
      endTime: '16:00',
      room: 'East Residence Hall',
      assignedTo: 'Housing Office Team',
      status: 'Scheduled',
      notes: 'Key card distribution and welcome packet issuance.'
    },
    {
      _id: 'evt-4',
      title: 'Faculty Lounge Reservation',
      category: 'Reservation',
      date: format(2),
      startTime: '10:00',
      endTime: '12:00',
      room: 'Central Hall Lounge',
      assignedTo: 'Dr. Evelyn Reed',
      status: 'Scheduled',
      notes: 'Department heads quarterly meeting.'
    },
    {
      _id: 'evt-5',
      title: 'Campus Housing Fire Drill',
      category: 'Event',
      date: format(4),
      startTime: '14:00',
      endTime: '15:30',
      room: 'All Quad Buildings',
      assignedTo: 'Campus Safety & Staff',
      status: 'Scheduled',
      notes: 'Mandatory evacuation drill for all residents.'
    },
    {
      _id: 'evt-6',
      title: 'Desk Lamp & Lock Maintenance',
      category: 'Maintenance',
      date: format(-2),
      startTime: '10:00',
      endTime: '11:00',
      room: 'C-307',
      assignedTo: 'Tech Sam Taylor',
      status: 'Completed',
      notes: 'Replaced faulty keycard reader and desk fixture.'
    },
    {
      _id: 'evt-7',
      title: 'Move-Out Inspection & Key Return',
      category: 'Inspection',
      date: format(5),
      startTime: '09:00',
      endTime: '12:00',
      room: 'West Hall - Floor 2',
      assignedTo: 'Staff Sarah Jenkins',
      status: 'Scheduled',
      notes: 'Verify room cleanliness and collect key cards.'
    }
  ]
}

const CATEGORIES = {
  Inspection: { label: 'Inspection', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ClipboardList, badgeBg: 'bg-rose-500' },
  Maintenance: { label: 'Maintenance', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Wrench, badgeBg: 'bg-amber-500' },
  'Move-in': { label: 'Move-in / Out', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: DoorOpen, badgeBg: 'bg-emerald-500' },
  Reservation: { label: 'Reservation', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: BookmarkCheck, badgeBg: 'bg-blue-500' },
  Event: { label: 'Campus Event', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Sparkles, badgeBg: 'bg-purple-500' }
}

const STATUSES = ['Scheduled', 'In progress', 'Completed', 'Cancelled']

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'day' | 'agenda'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const [events, setEvents] = useState(getInitialEvents)
  const [activeModal, setActiveModal] = useState(null) // null | 'add' | 'edit' | 'details'
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Inspection',
    date: formatDateKey(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    assignedTo: '',
    status: 'Scheduled',
    notes: ''
  })

  // Try fetching events from backend API if available
  useEffect(() => {
    let isMounted = true
    async function fetchEvents() {
      try {
        const res = await fetch('http://localhost:5000/api/events')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setEvents(data)
          }
        }
      } catch (err) {
        // Backend offline fallback
      }
    }
    fetchEvents()
    return () => { isMounted = false }
  }, [])

  // Month navigation helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  function handlePrev() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else if (viewMode === 'week') {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 1)
      setCurrentDate(d)
    }
  }

  function handleNext() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else if (viewMode === 'week') {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 1)
      setCurrentDate(d)
    }
  }

  function handleToday() {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (selectedCategory !== 'all' && evt.category !== selectedCategory) return false
      if (selectedStatus !== 'all' && evt.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = evt.title.toLowerCase().includes(q)
        const matchRoom = evt.room?.toLowerCase().includes(q)
        const matchStaff = evt.assignedTo?.toLowerCase().includes(q)
        const matchNotes = evt.notes?.toLowerCase().includes(q)
        if (!matchTitle && !matchRoom && !matchStaff && !matchNotes) return false
      }
      return true
    })
  }, [events, selectedCategory, selectedStatus, searchQuery])

  // Open add modal pre-filled for a date
  function openAddModal(dateStr = formatDateKey(currentDate)) {
    setFormData({
      title: '',
      category: 'Inspection',
      date: dateStr,
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      assignedTo: '',
      status: 'Scheduled',
      notes: ''
    })
    setSelectedEvent(null)
    setActiveModal('add')
  }

  function openEditModal(evt) {
    setSelectedEvent(evt)
    setFormData({
      title: evt.title,
      category: evt.category,
      date: evt.date,
      startTime: evt.startTime || '09:00',
      endTime: evt.endTime || '10:00',
      room: evt.room || '',
      assignedTo: evt.assignedTo || '',
      status: evt.status || 'Scheduled',
      notes: evt.notes || ''
    })
    setActiveModal('edit')
  }

  function openDetailsModal(evt) {
    setSelectedEvent(evt)
    setActiveModal('details')
  }

  async function handleSaveEvent(e) {
    e.preventDefault()
    if (!formData.title.trim() || !formData.date) return

    if (activeModal === 'add') {
      const newEvt = {
        _id: 'evt-' + Date.now(),
        ...formData
      }

      try {
        const res = await fetch('http://localhost:5000/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (res.ok) {
          const savedData = await res.json()
          setEvents(prev => [...prev, savedData])
          setActiveModal(null)
          return
        }
      } catch (err) {}

      setEvents(prev => [...prev, newEvt])
    } else if (activeModal === 'edit' && selectedEvent) {
      const updated = { ...selectedEvent, ...formData }

      try {
        if (!selectedEvent._id.startsWith('evt-')) {
          await fetch(`http://localhost:5000/api/events/${selectedEvent._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          })
        }
      } catch (err) {}

      setEvents(prev => prev.map(e => e._id === selectedEvent._id ? updated : e))
    }

    setActiveModal(null)
  }

  async function handleDeleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this scheduled event?')) return

    try {
      if (!eventId.startsWith('evt-')) {
        await fetch(`http://localhost:5000/api/events/${eventId}`, { method: 'DELETE' })
      }
    } catch (err) {}

    setEvents(prev => prev.filter(e => e._id !== eventId))
    setActiveModal(null)
  }

  async function handleToggleStatus(evt) {
    const nextStatus = evt.status === 'Completed' ? 'Scheduled' : 'Completed'
    const updated = { ...evt, status: nextStatus }

    try {
      if (!evt._id.startsWith('evt-')) {
        await fetch(`http://localhost:5000/api/events/${evt._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        })
      }
    } catch (err) {}

    setEvents(prev => prev.map(e => e._id === evt._id ? updated : e))
    if (selectedEvent?._id === evt._id) {
      setSelectedEvent(updated)
    }
  }

  // Month grid calculations
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate()

    const days = []

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === formatDateKey(new Date())
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: true,
        isToday: formatDateKey(d) === formatDateKey(new Date())
      })
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0)
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === formatDateKey(new Date())
      })
    }

    return days
  }, [year, month])

  // Week days calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate)
    const first = curr.getDate() - curr.getDay()
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i))
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isToday: formatDateKey(d) === formatDateKey(new Date())
      })
    }
    return days
  }, [currentDate])

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto overflow-hidden">
      {/* Screen-fitting Full Height Calendar Card */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm overflow-hidden">
        
        {/* Header Navigation & View Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          
          {/* Month / Year Display & Navigation */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#0d8c7a]" />
              {monthNames[month]} <span className="text-slate-400 font-semibold">{year}</span>
            </h2>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-md p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition"
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-0.5 text-xs font-bold text-[#0d8c7a] hover:bg-white rounded-md transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-md p-1 text-slate-600 hover:bg-white hover:text-slate-900 transition"
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* View Modes, Search, and Add Event */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* View Selector Pills */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-bold text-slate-600">
              {['month', 'week', 'day', 'agenda'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`capitalize px-2.5 py-1 rounded-md transition ${viewMode === mode ? 'bg-white text-[#0d8c7a] shadow-xs' : 'hover:text-slate-900'}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-36 sm:w-44 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs outline-none focus:border-[#0d8c7a]"
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

            {/* Schedule Event Button */}
            <button
              type="button"
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d8c7a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Event
            </button>

          </div>

        </div>

        {/* Compact Category & Status Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs border-b border-slate-100 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 font-bold text-slate-400 mr-1 text-[11px]">
              <Filter className="h-3 w-3" /> Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const IconComp = cat.icon
              const isSelected = selectedCategory === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(key)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition ${isSelected ? 'bg-[#0d8c7a] text-white border-[#0d8c7a]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                  <IconComp className="h-3 w-3" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-[#0d8c7a]"
            >
              <option value="all">All</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* VIEW MODE 1: MONTH GRID (Fills Remaining Screen Height) */}
        {viewMode === 'month' && (
          <div className="flex-1 flex flex-col min-h-0 mt-2">
            
            {/* Weekday Name Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-bold text-slate-500 pb-1 shrink-0">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Flexible Month Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 border-b border-slate-100 min-h-0">
              {monthDays.map((dayItem, idx) => {
                const dayEvts = filteredEvents.filter(e => e.date === dayItem.dateStr)
                const isSelected = formatDateKey(selectedDate) === dayItem.dateStr

                return (
                  <div
                    key={dayItem.dateStr + '-' + idx}
                    onClick={() => setSelectedDate(dayItem.date)}
                    className={`p-1 flex flex-col justify-between group cursor-pointer transition min-h-0 overflow-hidden ${
                      !dayItem.isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white text-slate-900'
                    } ${dayItem.isToday ? 'bg-teal-50/30' : ''} ${isSelected ? 'ring-2 ring-[#0d8c7a] ring-inset' : ''} hover:bg-slate-50`}
                  >
                    {/* Cell Day Header */}
                    <div className="flex items-center justify-between shrink-0">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                          dayItem.isToday
                            ? 'bg-[#0d8c7a] text-white shadow-xs'
                            : 'text-slate-700'
                        }`}
                      >
                        {dayItem.date.getDate()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddModal(dayItem.dateStr)
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                        title="Add event"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Events Badges in Day Cell */}
                    <div className="mt-0.5 space-y-0.5 overflow-hidden flex-1 min-h-0">
                      {dayEvts.slice(0, 2).map(evt => {
                        const catConfig = CATEGORIES[evt.category] || CATEGORIES.Event
                        const isDone = evt.status === 'Completed'

                        return (
                          <button
                            key={evt._id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDetailsModal(evt)
                            }}
                            className={`w-full text-left truncate rounded px-1 py-0.5 text-[10px] font-semibold border flex items-center gap-1 transition ${
                              isDone ? 'line-through opacity-60 bg-slate-100 border-slate-200 text-slate-500' : catConfig.color
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${catConfig.badgeBg}`} />
                            <span className="truncate">{evt.startTime} {evt.title}</span>
                          </button>
                        )
                      })}
                      {dayEvts.length > 2 && (
                        <p className="text-[9px] font-bold text-slate-500 px-0.5">
                          +{dayEvts.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* VIEW MODE 2: WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="flex-1 overflow-auto min-h-0 mt-2">
            <div className="grid grid-cols-7 border-b border-slate-200 divide-x divide-slate-100 h-full">
              {weekDays.map(d => {
                const dayEvts = filteredEvents.filter(e => e.date === d.dateStr)
                return (
                  <div key={d.dateStr} className="p-2 text-center bg-slate-50 flex flex-col h-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {d.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`mt-0.5 inline-flex h-6 w-6 mx-auto items-center justify-center rounded-full text-xs font-bold ${d.isToday ? 'bg-[#0d8c7a] text-white' : 'text-slate-900'}`}>
                      {d.date.getDate()}
                    </p>
                    <div className="mt-2 space-y-1.5 text-left flex-1 overflow-auto">
                      {dayEvts.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-4">No events</p>
                      ) : (
                        dayEvts.map(evt => {
                          const cat = CATEGORIES[evt.category] || CATEGORIES.Event
                          return (
                            <div
                              key={evt._id}
                              onClick={() => openDetailsModal(evt)}
                              className={`rounded-lg border p-1.5 text-xs font-semibold cursor-pointer shadow-xs transition hover:shadow-md ${cat.color}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] opacity-80">{evt.startTime}</span>
                                {evt.status === 'Completed' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                              </div>
                              <p className="font-bold mt-0.5 text-slate-900 truncate text-[11px]">{evt.title}</p>
                              {evt.room && <p className="text-[9px] opacity-80 truncate">📍 {evt.room}</p>}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 3: DAY VIEW */}
        {viewMode === 'day' && (
          <div className="flex-1 overflow-auto min-h-0 mt-2 space-y-3">
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {filteredEvents.filter(e => e.date === formatDateKey(currentDate)).length} events scheduled
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddModal(formatDateKey(currentDate))}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0d8c7a] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#087364]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Event
              </button>
            </div>

            <div className="space-y-2">
              {filteredEvents.filter(e => e.date === formatDateKey(currentDate)).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-500">
                  <CalendarIcon className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-bold">No events scheduled for this day</p>
                  <button
                    type="button"
                    onClick={() => openAddModal(formatDateKey(currentDate))}
                    className="mt-2 text-xs font-bold text-[#0d8c7a] hover:underline"
                  >
                    + Schedule event
                  </button>
                </div>
              ) : (
                filteredEvents
                  .filter(e => e.date === formatDateKey(currentDate))
                  .map(evt => {
                    const catConfig = CATEGORIES[evt.category] || CATEGORIES.Event
                    const IconComp = catConfig.icon
                    return (
                      <div
                        key={evt._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs gap-3 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`rounded-lg p-2 border ${catConfig.color}`}>
                            <IconComp className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${catConfig.color}`}>
                                {evt.category}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                evt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {evt.status}
                              </span>
                            </div>
                            <h4 className="mt-1 text-xs font-bold text-slate-900">{evt.title}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-400" /> {evt.startTime} - {evt.endTime}</span>
                              {evt.room && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /> {evt.room}</span>}
                              {evt.assignedTo && <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" /> {evt.assignedTo}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(evt)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              evt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {evt.status === 'Completed' ? 'Completed ✓' : 'Mark Done'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(evt)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE 4: AGENDA / LIST VIEW */}
        {viewMode === 'agenda' && (
          <div className="flex-1 overflow-auto min-h-0 mt-2 space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
                <Search className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-bold">No matching calendar events found</p>
              </div>
            ) : (
              filteredEvents
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map(evt => {
                  const catConfig = CATEGORIES[evt.category] || CATEGORIES.Event
                  const IconComp = catConfig.icon
                  const isDone = evt.status === 'Completed'

                  return (
                    <div
                      key={evt._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs hover:shadow-md transition gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-center shrink-0 w-14 bg-slate-50 rounded-lg p-1.5 border border-slate-200">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">
                            {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="block text-base font-extrabold text-slate-900">
                            {new Date(evt.date + 'T00:00:00').getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold ${catConfig.color}`}>
                              <IconComp className="h-3 w-3" />
                              {evt.category}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {evt.status}
                            </span>
                          </div>
                          <h4 className="mt-1 text-xs font-bold text-slate-900">{evt.title}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-400" /> {evt.startTime} - {evt.endTime}</span>
                            {evt.room && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /> {evt.room}</span>}
                            {evt.assignedTo && <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" /> {evt.assignedTo}</span>}
                          </div>
                          {evt.notes && <p className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 rounded-md p-1.5 border border-slate-100">{evt.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(evt)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isDone ? 'Completed ✓' : 'Mark Done'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(evt)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt._id)}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}

      </div>

      {/* ADD / EDIT EVENT MODAL */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#0d8c7a]" />
                {activeModal === 'add' ? 'Schedule New Event' : 'Edit Event Details'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room A-102 Move-In Inspection"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  >
                    {Object.keys(CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Room / Facility</label>
                  <input
                    type="text"
                    placeholder="e.g. B-204"
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Assigned Staff</label>
                  <input
                    type="text"
                    placeholder="e.g. Officer Marcus"
                    value={formData.assignedTo}
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-[#0d8c7a]"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
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
                  className="rounded-lg bg-[#0d8c7a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#087364] shadow-xs"
                >
                  {activeModal === 'add' ? 'Save Event' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAILS POPUP MODAL */}
      {activeModal === 'details' && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-slate-100 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${CATEGORIES[selectedEvent.category]?.color}`}>
                  {selectedEvent.category}
                </span>
                <h3 className="mt-1.5 text-base font-bold text-slate-900">{selectedEvent.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarIcon className="h-3.5 w-3.5 text-[#0d8c7a]" />
                <span className="font-bold">Date:</span> {selectedEvent.date}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="h-3.5 w-3.5 text-[#0d8c7a]" />
                <span className="font-bold">Time:</span> {selectedEvent.startTime} - {selectedEvent.endTime}
              </div>
              {selectedEvent.room && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-[#0d8c7a]" />
                  <span className="font-bold">Room:</span> {selectedEvent.room}
                </div>
              )}
              {selectedEvent.assignedTo && (
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-3.5 w-3.5 text-[#0d8c7a]" />
                  <span className="font-bold">Staff:</span> {selectedEvent.assignedTo}
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-700">
                <Tag className="h-3.5 w-3.5 text-[#0d8c7a]" />
                <span className="font-bold">Status:</span> 
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  selectedEvent.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedEvent.status}
                </span>
              </div>
            </div>

            {selectedEvent.notes && (
              <div>
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-400" /> Notes:
                </p>
                <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {selectedEvent.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleDeleteEvent(selectedEvent._id)}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedEvent)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedEvent.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {selectedEvent.status === 'Completed' ? 'Completed ✓' : 'Mark Done'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(selectedEvent)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0d8c7a] px-3 py-1 text-xs font-bold text-white hover:bg-[#087364]"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
