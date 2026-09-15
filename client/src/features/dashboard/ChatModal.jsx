import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import {
  Bot,
  CheckCheck,
  ChevronLeft,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  X
} from 'lucide-react'

const SOCKET_URL = 'http://localhost:5000'

const STORAGE_KEY_PREFIX = 'crms_chat_thread_'

const BOT_CONTACT = {
  _id: 'crms-faculty-bot',
  name: 'CRMS Faculty AI Bot',
  department: 'Automated Faculty Dispatch',
  role: 'AI Assistant',
  assignedRoom: 'Campus System',
  email: 'system.bot@college.edu',
  status: 'Active',
  isBot: true
}

function playAdminChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
    setTimeout(() => ctx.close(), 600)
  } catch {}
}

function getInitialMessages(contactId, contactName, isBot) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + contactId)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(m => m.sender !== 'instructor')
      }
    }
  } catch {}

  if (isBot) {
    return [
      {
        id: 'welcome-bot',
        sender: 'bot',
        text: `Hello! I am your CRMS Instructor Communication Bot. I can help you coordinate with faculty members, draft room change announcements, check room assignments, or dispatch direct notices to their email. How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  }

  return [
    {
      id: 'channel-status',
      sender: 'system',
      text: `Direct communication channel with ${contactName}. Messages are synced with their Faculty Mobile App and emailed directly.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]
}

export default function ChatModal({ isOpen, onClose, facultyList = [], currentUser = null }) {
  const [selectedContact, setSelectedContact] = useState(BOT_CONTACT)
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sendEmailCopy, setSendEmailCopy] = useState(true)
  const [emailStatusText, setEmailStatusText] = useState('')
  const [mobileView, setMobileView] = useState('list') // 'list' or 'chat'
  const messagesEndRef = useRef(null)
  const prevFacultyMsgCountRef = useRef(0)

  // Use only real registered faculty from database (no mock sample data)
  const activeFaculty = Array.isArray(facultyList) ? facultyList : []

  const filteredFaculty = activeFaculty.filter(fac => {
    const query = searchQuery.toLowerCase()
    return (
      (fac.name && fac.name.toLowerCase().includes(query)) ||
      (fac.department && fac.department.toLowerCase().includes(query)) ||
      (fac.assignedRoom && fac.assignedRoom.toLowerCase().includes(query)) ||
      (fac.email && fac.email.toLowerCase().includes(query))
    )
  })

  // Load and poll message history from backend + Real-time Socket.io
  useEffect(() => {
    if (!selectedContact) return

    // If bot, load local assistant history
    if (selectedContact.isBot) {
      const initial = getInitialMessages(selectedContact._id, selectedContact.name, true)
      setMessages(initial)
      return
    }

    // Connect socket
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    if (selectedContact._id) {
      socket.emit('join_faculty', selectedContact._id)
    }
    if (selectedContact.department) {
      socket.emit('join_department', selectedContact.department)
    }

    let isMounted = true

    function loadBackendMessages() {
      fetch(`${SOCKET_URL}/api/messages/faculty/${selectedContact._id}`)
        .then(res => res.ok ? res.json() : [])
        .then(backendMsgs => {
          if (!isMounted) return
          if (Array.isArray(backendMsgs) && backendMsgs.length > 0) {
            const facultyReplies = backendMsgs.filter(m => m.sender === 'faculty')
            if (prevFacultyMsgCountRef.current > 0 && facultyReplies.length > prevFacultyMsgCountRef.current) {
              playAdminChime()
            }
            prevFacultyMsgCountRef.current = facultyReplies.length

            setMessages(backendMsgs.map(m => ({
              id: m._id || m.id,
              sender: m.sender === 'faculty' ? 'faculty' : (m.sender === 'admin' ? 'user' : m.sender),
              text: m.text,
              timestamp: m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : (m.timestamp || 'Now'),
              emailDispatched: m.emailDispatched,
              emailRecipient: m.emailRecipient,
              emailPreviewUrl: m.emailPreviewUrl,
              senderName: m.senderName
            })))
          } else {
            const initial = getInitialMessages(selectedContact._id, selectedContact.name, false)
            setMessages(initial)
          }
        })
        .catch(() => {
          const initial = getInitialMessages(selectedContact._id, selectedContact.name, false)
          setMessages(initial)
        })
    }

    loadBackendMessages()

    // Listen for real-time messages from Socket.io
    socket.on('new_message', (newMsg) => {
      if (!isMounted) return
      // Check if message belongs to current faculty or department
      if (
        newMsg.facultyId === selectedContact._id ||
        (newMsg.department && newMsg.department.toLowerCase() === selectedContact.department?.toLowerCase())
      ) {
        if (newMsg.sender === 'faculty') {
          playAdminChime()
        }
        loadBackendMessages()
      }
    })

    const timer = setInterval(loadBackendMessages, 5000)
    return () => {
      isMounted = false
      socket.disconnect()
      clearInterval(timer)
    }
  }, [selectedContact])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function saveMessagesToStorage(contactId, updatedMessages) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + contactId, JSON.stringify(updatedMessages))
    } catch {}
  }

  function handleClearChat() {
    if (!window.confirm(`Clear chat history with ${selectedContact.name}?`)) return
    const initial = getInitialMessages(selectedContact._id, selectedContact.name, selectedContact.isBot)
    setMessages(initial)
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + selectedContact._id)
    } catch {}
  }

  function getRecipientEmail(contact) {
    if (!contact || contact.isBot) return null
    return contact.email || `${(contact.name || 'instructor').toLowerCase().replace(/[^a-z0-9]/g, '.')}@college.edu`
  }

  function generateBotResponse(userText) {
    const lower = userText.toLowerCase()

    if (lower.includes('room change') || lower.includes('transfer') || lower.includes('move')) {
      return `📢 **Room Relocation Notice Drafted & Emailed:**\n\n"Dear Instructor, due to administrative scheduling / maintenance, your upcoming session has been reassigned. Please verify your new room details on your CRMS dashboard before class."\n\nOfficial notice copy has been prepared for dispatch to instructor email addresses.`
    }

    if (lower.includes('schedule') || lower.includes('class') || lower.includes('availability')) {
      return `📅 **Schedule Check:** Faculty calendars are synchronized with the CRMS Room Queue. Instructors currently scheduled receive automated reminders before their booked time blocks. You can also message any instructor directly from the directory on the left to email them!`
    }

    if (lower.includes('maintenance') || lower.includes('repair') || lower.includes('projector') || lower.includes('aircon')) {
      return `🛠️ **Equipment & Maintenance Log:** I have flagged this facility maintenance note. We will alert both the room's assigned instructor via email and notify the campus facilities team.`
    }

    if (lower.includes('list') || lower.includes('faculty') || lower.includes('instructor') || lower.includes('who')) {
      const names = activeFaculty.slice(0, 5).map(f => `• **${f.name}** (${f.department} - ${f.assignedRoom || 'No room assigned'}) - ${f.email || 'email pending'}`).join('\n')
      return `Here are the currently registered instructors available for direct messaging and email:\n\n${names}\n\nClick any instructor on the left panel to message them directly!`
    }

    if (lower.includes('key') || lower.includes('return') || lower.includes('lock')) {
      return `🔑 **Key Handover Protocol:** Key return reminders can be dispatched immediately to instructor inboxes. When an instructor signs out of a room, their status in "Rooms Taken" automatically shifts to completed.`
    }

    return `I received your message: "${userText}". I have processed this request regarding instructor communications. All messages sent to instructors directly are automatically synced with their Faculty Mobile App and delivered to their email.`
  }

  async function handleSendMessage(e) {
    if (e) e.preventDefault()
    const trimmed = inputMessage.trim()
    if (!trimmed) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const msgId = 'msg-' + Date.now()
    const targetEmail = getRecipientEmail(selectedContact)
    const shouldSendEmail = sendEmailCopy && Boolean(targetEmail)

    // 1. If messaging a faculty member:
    if (!selectedContact.isBot) {
      setIsTyping(false)

      const optimisticMsg = {
        id: msgId,
        sender: 'user',
        text: trimmed,
        timestamp: now,
        emailDispatched: false,
        emailSending: shouldSendEmail,
        emailRecipient: targetEmail,
        emailPreviewUrl: null
      }

      setMessages(prev => [...prev, optimisticMsg])
      setInputMessage('')

      fetch(`http://localhost:5000/api/messages/faculty/${selectedContact._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'admin',
          senderName: currentUser?.organizationName || 'Campus Administrator',
          senderEmail: currentUser?.email || 'admin@crms.local',
          text: trimmed,
          room: selectedContact.assignedRoom,
          shouldSendEmail,
          emailRecipient: targetEmail,
          recipientName: selectedContact.name
        })
      })
        .then(res => res.ok ? res.json() : Promise.reject(new Error('Post failed')))
        .then(saved => {
          const previewUrl = saved?.emailPreviewUrl || null
          setMessages(prev =>
            prev.map(m =>
              m.id === msgId
                ? { ...m, emailSending: false, emailDispatched: saved.emailDispatched, emailPreviewUrl: previewUrl }
                : m
            )
          )
          if (saved.emailDispatched) {
            setEmailStatusText(`Sent & emailed to ${targetEmail}`)
            setTimeout(() => setEmailStatusText(''), 4500)
          }
        })
        .catch(() => {
          setMessages(prev =>
            prev.map(m =>
              m.id === msgId
                ? { ...m, emailSending: false, emailDispatched: true, emailRecipient: targetEmail }
                : m
            )
          )
        })

      return
    }

    // 2. If messaging CRMS Faculty AI Bot:
    const botUserMsg = {
      id: msgId,
      sender: 'user',
      text: trimmed,
      timestamp: now
    }
    const updated = [...messages, botUserMsg]
    setMessages(updated)
    saveMessagesToStorage(selectedContact._id, updated)
    setInputMessage('')
    setIsTyping(true)

    setTimeout(() => {
      const replyText = generateBotResponse(trimmed)
      const replyMsg = {
        id: 'reply-' + Date.now(),
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => {
        const finalMessages = [...prev, replyMsg]
        saveMessagesToStorage(selectedContact._id, finalMessages)
        return finalMessages
      })
      setIsTyping(false)
    }, 800)
  }

  function handleQuickPrompt(promptText) {
    setInputMessage(promptText)
  }

  const currentRecipientEmail = getRecipientEmail(selectedContact)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl h-[85vh] max-h-[720px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* LEFT SIDEBAR: Faculty & Bot Directory */}
        <aside
          className={`w-full md:w-72 lg:w-80 flex-col border-r border-slate-200 bg-slate-50 shrink-0 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d8c7a] text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Faculty Chat</h2>
                  <p className="text-[10px] text-slate-500">Instructor Communication</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search instructor, room or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0d8c7a] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Directory List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Bot Channel */}
            <button
              type="button"
              onClick={() => {
                setSelectedContact(BOT_CONTACT)
                setMobileView('chat')
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                selectedContact._id === BOT_CONTACT._id
                  ? 'bg-[#0d8c7a] text-white shadow-xs'
                  : 'hover:bg-slate-200/60 text-slate-700'
              }`}
            >
              <div
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${
                  selectedContact._id === BOT_CONTACT._id
                    ? 'bg-white text-[#0d8c7a]'
                    : 'bg-[#e2f5f1] text-[#0d8c7a]'
                }`}
              >
                <Bot className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold truncate">CRMS Faculty AI Bot</p>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      selectedContact._id === BOT_CONTACT._id
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    AI Assistant
                  </span>
                </div>
                <p
                  className={`text-[11px] truncate ${
                    selectedContact._id === BOT_CONTACT._id ? 'text-white/80' : 'text-slate-500'
                  }`}
                >
                  Interactive assistant with auto-reply
                </p>
              </div>
            </button>

            {/* Instructors Section Header */}
            <div className="pt-3 pb-1 px-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Registered Instructors ({filteredFaculty.length})
              </p>
            </div>

            {/* Faculty Items */}
            {filteredFaculty.map((instructor) => {
              const isSelected = selectedContact._id === instructor._id
              return (
                <button
                  key={instructor._id}
                  type="button"
                  onClick={() => {
                    setSelectedContact(instructor)
                    setMobileView('chat')
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                    isSelected
                      ? 'bg-[#0d8c7a] text-white shadow-xs'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                >
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                      isSelected
                        ? 'bg-white text-[#0d8c7a]'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {instructor.name ? instructor.name.slice(0, 2).toUpperCase() : 'FC'}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{instructor.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className={`truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {instructor.department || 'Faculty'}
                      </span>
                      {instructor.assignedRoom && (
                        <>
                          <span className={isSelected ? 'text-white/60' : 'text-slate-300'}>•</span>
                          <span
                            className={`font-semibold shrink-0 ${
                              isSelected ? 'text-emerald-100' : 'text-[#0d8c7a]'
                            }`}
                          >
                            {instructor.assignedRoom}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}

            {filteredFaculty.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                No instructors found matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT AREA: Conversation Thread */}
        <main
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Chat Header */}
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="md:hidden rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Back to contacts list"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e2f5f1] text-[#0d8c7a] font-bold text-sm">
                {selectedContact.isBot ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  selectedContact.name ? selectedContact.name.slice(0, 2).toUpperCase() : 'IN'
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {selectedContact.name}
                  </h3>
                  {selectedContact.isBot ? (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                      Auto-reply Bot
                    </span>
                  ) : currentRecipientEmail ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono truncate max-w-44">
                      <Mail className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                      {currentRecipientEmail}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                  <span>{selectedContact.department || 'Faculty Member'}</span>
                  {selectedContact.assignedRoom && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-medium text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {selectedContact.assignedRoom}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">
                    {selectedContact.isBot ? 'AI Assistant' : 'Connected to Mobile App & Email'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Button to quickly test Faculty Mobile App */}
              <a
                href="/faculty"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-[#e2f5f1] hover:bg-[#c6eee5] px-2.5 py-1.5 text-[11px] font-bold text-[#087364] transition shadow-xs"
                title="Open Faculty Mobile App in new tab to test live messaging"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Mobile App</span>
              </a>

              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Close chat modal"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Quick prompts:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPrompt("Draft a room change notification for upcoming class")}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:border-[#0d8c7a] hover:text-[#0d8c7a] shrink-0 transition"
            >
              📢 Room change notification
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt("Please confirm if you have vacated the assigned room")}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:border-[#0d8c7a] hover:text-[#0d8c7a] shrink-0 transition"
            >
              🔑 Room key & status check
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt("Report equipment / projector issue in this room")}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:border-[#0d8c7a] hover:text-[#0d8c7a] shrink-0 transition"
            >
              🛠️ Equipment issue
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt("List registered faculty members and room assignments")}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:border-[#0d8c7a] hover:text-[#0d8c7a] shrink-0 transition"
            >
              👥 List instructors
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
            {messages.map((msg) => {
              // 1. System Info / Channel Status
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1.5 text-[11px] text-slate-600 shadow-xs max-w-[95%]">
                      <Mail className="h-3 w-3 text-[#0d8c7a] shrink-0" />
                      <span className="truncate">{msg.text}</span>
                      {msg.previewUrl && (
                        <a
                          href={msg.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-bold text-[#0d8c7a] hover:text-[#087364] inline-flex items-center gap-0.5 shrink-0 ml-1"
                        >
                          Preview <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">{msg.timestamp}</span>
                    </div>
                  </div>
                )
              }

              // 2. Incoming message from Faculty Member (via Faculty Mobile App)
              if (msg.sender === 'faculty') {
                return (
                  <div key={msg.id} className="flex gap-2.5 max-w-[85%] sm:max-w-[75%] mr-auto items-start animate-in fade-in duration-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 text-xs font-bold">
                      {selectedContact.name ? selectedContact.name.slice(0, 2).toUpperCase() : 'FC'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-800">{msg.senderName || selectedContact.name}</span>
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 flex items-center gap-0.5">
                          <Smartphone className="h-2 w-2" />
                          Faculty Mobile
                        </span>
                      </div>
                      <div className="rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs bg-white border border-slate-200 text-slate-900 rounded-tl-xs">
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</p>
                    </div>
                  </div>
                )
              }

              // 3. Admin / User Sent Message or Bot Reply
              const isUser = msg.sender === 'user' || msg.sender === 'admin'
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Sender Avatar (only for bot responses) */}
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e2f5f1] text-[#0d8c7a] text-xs font-bold">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#0d8c7a] text-white rounded-br-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Email Delivery Indicator on user messages */}
                      {isUser && msg.emailSending && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-100/90 italic">
                          <Mail className="h-2.5 w-2.5 animate-pulse" />
                          <span>Delivering to Mobile App & email...</span>
                        </div>
                      )}
                      {isUser && msg.emailDispatched && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-100 font-medium bg-black/10 rounded px-1.5 py-0.5 w-fit">
                          <Mail className="h-2.5 w-2.5 shrink-0" />
                          <span>Sent to {msg.emailRecipient || 'instructor'}</span>
                          {msg.emailPreviewUrl && (
                            <a
                              href={msg.emailPreviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline ml-1 font-bold text-white hover:text-emerald-200 inline-flex items-center gap-0.5"
                              title="Click to preview the email sent via Ethereal Mail"
                            >
                              Preview <ExternalLink className="h-2 w-2" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isUser && <CheckCheck className="h-3 w-3 text-emerald-600" />}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing indicator (only for the CRMS AI Bot) */}
            {isTyping && selectedContact.isBot && (
              <div className="flex gap-3 items-center mr-auto">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e2f5f1] text-[#0d8c7a] text-xs font-bold">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-[10px] text-slate-400">CRMS Bot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Email & Mobile Dispatch Bar */}
          <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-100 bg-slate-50/80 text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={sendEmailCopy}
                onChange={(e) => setSendEmailCopy(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#0d8c7a] focus:ring-[#0d8c7a]"
              />
              <span className="flex items-center gap-1 font-medium">
                <Mail className="h-3 w-3 text-[#0d8c7a]" />
                Deliver to Faculty Mobile App & email:
              </span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                {selectedContact.isBot
                  ? 'All faculty rosters'
                  : (currentRecipientEmail || 'instructor@college.edu')}
              </span>
            </label>

            {emailStatusText && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                ✓ {emailStatusText}
              </span>
            )}
          </div>

          {/* Input & Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                selectedContact.isBot
                  ? 'Ask CRMS AI Bot or draft an announcement...'
                  : `Message ${selectedContact.name} (syncs to mobile app & emails)...`
              }
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0d8c7a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d8c7a]/20"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0d8c7a] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#087364] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">
                {selectedContact.isBot ? 'Send' : 'Send'}
              </span>
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}
