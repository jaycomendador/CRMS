/**
 * CRMS Faculty Chat Client (TypeScript Edition)
 * 
 * A standalone TypeScript chat client for faculty members to communicate 
 * in real-time with the College Room Management System (CRMS) admin chat.
 * 
 * Usage:
 *   npx tsx crms-faculty-chat.ts
 *   or:
 *   npx ts-node crms-faculty-chat.ts
 */

import readline from 'readline'

const API_BASE = process.env.CRMS_API_URL || 'http://localhost:5000/api'

interface Faculty {
  _id: string
  name: string
  department: string
  role?: string
  assignedRoom?: string
  email?: string
}

interface Message {
  _id?: string
  facultyId: string
  sender: 'admin' | 'faculty' | 'bot' | 'system'
  senderName?: string
  text: string
  room?: string
  createdAt?: string
}

const DEFAULT_FACULTY: Faculty[] = [
  {
    _id: 'sample-1',
    name: 'Dr. Evelyn Martinez',
    department: 'Computer Science',
    assignedRoom: 'Lab 204',
    email: 'evelyn.martinez@college.edu'
  },
  {
    _id: 'sample-2',
    name: 'Prof. Marcus Vance',
    department: 'Engineering',
    assignedRoom: 'Eng-301',
    email: 'marcus.vance@college.edu'
  },
  {
    _id: 'sample-3',
    name: 'Dr. Sarah Jenkins',
    department: 'Mathematics',
    assignedRoom: 'Math-108',
    email: 'sarah.jenkins@college.edu'
  }
]

class CRMSChatClient {
  private rl: readline.Interface
  private activeFaculty: Faculty | null = null
  private seenMessageIds = new Set<string>()
  private pollingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  public async start(): Promise<void> {
    console.clear()
    console.log('\x1b[36m%s\x1b[0m', '╔══════════════════════════════════════════════════════════════════╗')
    console.log('\x1b[36m%s\x1b[0m', '║       CRMS Faculty System Chat Client (TypeScript Edition)       ║')
    console.log('\x1b[36m%s\x1b[0m', '╚══════════════════════════════════════════════════════════════════╝')
    console.log('Connecting to CRMS backend at:', API_BASE)

    const facultyList = await this.loadFacultyList()
    await this.selectFaculty(facultyList)
    await this.startChatLoop()
  }

  private async loadFacultyList(): Promise<Faculty[]> {
    try {
      const res = await fetch(`${API_BASE}/faculty`)
      if (res.ok) {
        const data = (await res.json()) as Faculty[]
        if (Array.isArray(data) && data.length > 0) {
          return data
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_FACULTY
  }

  private selectFaculty(facultyList: Faculty[]): Promise<void> {
    return new Promise((resolve) => {
      console.log('\n\x1b[33m%s\x1b[0m', 'Select your faculty profile to login:')
      facultyList.forEach((fac, idx) => {
        console.log(`  [${idx + 1}] ${fac.name} (${fac.department} - Room: ${fac.assignedRoom || 'None'})`)
      })

      this.rl.question('\nEnter number [1]: ', (answer) => {
        const choice = parseInt(answer.trim(), 10)
        const index = isNaN(choice) || choice < 1 || choice > facultyList.length ? 0 : choice - 1
        this.activeFaculty = facultyList[index]

        console.log('\n\x1b[32m%s\x1b[0m', `✓ Logged in as: ${this.activeFaculty.name}`)
        console.log(`  Department: ${this.activeFaculty.department}`)
        console.log(`  Assigned Room: ${this.activeFaculty.assignedRoom || 'Unassigned'}`)
        console.log('------------------------------------------------------------------')
        console.log('Type your message and press ENTER to send directly to CRMS Admin.')
        console.log('Special commands: /bot <question>  |  /refresh  |  /exit')
        console.log('------------------------------------------------------------------\n')
        resolve()
      })
    })
  }

  private async startChatLoop(): Promise<void> {
    if (!this.activeFaculty) return

    // Initial message load
    await this.fetchAndPrintMessages(true)

    // Poll every 3 seconds
    this.pollingInterval = setInterval(() => {
      this.fetchAndPrintMessages(false).catch(() => {})
    }, 3000)

    // Prompt
    this.promptUser()
  }

  private promptUser(): void {
    this.rl.question('\x1b[32mYou > \x1b[0m', async (input) => {
      const trimmed = input.trim()
      if (!trimmed) {
        this.promptUser()
        return
      }

      if (trimmed === '/exit' || trimmed === 'exit') {
        console.log('Closing CRMS Faculty Chat. Goodbye!')
        if (this.pollingInterval) clearInterval(this.pollingInterval)
        this.rl.close()
        process.exit(0)
      }

      if (trimmed === '/refresh') {
        console.log('Refreshing messages...')
        await this.fetchAndPrintMessages(true)
        this.promptUser()
        return
      }

      if (trimmed.startsWith('/bot')) {
        const query = trimmed.replace('/bot', '').trim()
        console.log('\x1b[35m%s\x1b[0m', `[CRMS AI BOT]: Thinking...`)
        setTimeout(() => {
          let botReply = 'I have noted your inquiry. For official room reassignments, please message the campus administration directly.'
          const lower = query.toLowerCase()
          if (lower.includes('key')) botReply = 'Keys must be returned to the Ground Floor Administration Desk right after class.'
          else if (lower.includes('projector') || lower.includes('ac')) botReply = 'Maintenance flag noted. Campus facilities has been queued.'
          else if (lower.includes('room')) botReply = `Your assigned room is ${this.activeFaculty?.assignedRoom || 'Lecture Hall'}.`
          console.log('\x1b[35m%s\x1b[0m', `[CRMS AI BOT]: ${botReply}\n`)
          this.promptUser()
        }, 600)
        return
      }

      // Send to Admin
      try {
        const res = await fetch(`${API_BASE}/messages/faculty/${this.activeFaculty?._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'faculty',
            senderName: this.activeFaculty?.name,
            senderEmail: this.activeFaculty?.email,
            text: trimmed,
            room: this.activeFaculty?.assignedRoom,
            shouldSendEmail: false
          })
        })

        if (res.ok) {
          const sent = (await res.json()) as Message
          if (sent._id) this.seenMessageIds.add(sent._id)
          console.log('\x1b[90m%s\x1b[0m', `[Delivered to CRMS Admin Chat • ${new Date().toLocaleTimeString()}]`)
        } else {
          console.log('\x1b[31m%s\x1b[0m', 'Failed to send message to server.')
        }
      } catch (err: any) {
        console.log('\x1b[31m%s\x1b[0m', `Network error sending message: ${err.message}`)
      }

      this.promptUser()
    })
  }

  private async fetchAndPrintMessages(isInitialLoad: boolean): Promise<void> {
    if (!this.activeFaculty) return

    try {
      const res = await fetch(`${API_BASE}/messages/faculty/${this.activeFaculty._id}`)
      if (!res.ok) return
      const messages = (await res.json()) as Message[]

      if (!Array.isArray(messages)) return

      if (isInitialLoad && messages.length === 0) {
        console.log('\x1b[90m%s\x1b[0m', 'No previous messages in this channel.\n')
      }

      for (const msg of messages) {
        const id = msg._id || `${msg.sender}-${msg.text}-${msg.createdAt}`
        if (!this.seenMessageIds.has(id)) {
          this.seenMessageIds.add(id)

          const time = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Now'

          if (msg.sender === 'admin') {
            console.log('\n\x1b[33m%s\x1b[0m', `[ADMIN - ${msg.senderName || 'Campus Staff'}] (${time}):`)
            console.log(`  ${msg.text}`)
            if (msg.room) console.log('\x1b[90m%s\x1b[0m', `  (Room Reference: ${msg.room})`)
            readline.cursorTo(process.stdout, 0)
          } else if (msg.sender === 'faculty' && isInitialLoad) {
            console.log('\x1b[32m%s\x1b[0m', `[You] (${time}): ${msg.text}`)
          }
        }
      }
    } catch {
      // Network retry
    }
  }
}

const client = new CRMSChatClient()
client.start().catch(console.error)
