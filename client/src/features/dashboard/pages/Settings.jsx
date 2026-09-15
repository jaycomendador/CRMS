import { useEffect, useState } from 'react'
import {
  Bell,
  Clock3,
  DoorOpen,
  LogOut,
  Moon,
  Save,
  Settings as SettingsIcon,
  Sun,
  UserRound
} from 'lucide-react'
import DashboardPage from '../DashboardPage'
import { applyTheme, getSettings, saveSettings } from '../settings'

function SettingToggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
      <span>
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-[#0d8c7a]' : 'bg-slate-200'}`}>
        <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="sr-only" />
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </label>
  )
}

export default function Settings({ staff, onLogout }) {
  const [settings, setSettings] = useState(getSettings)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  function updateSettings(changes) {
    setSettings(current => saveSettings({ ...current, ...changes }))
    setNotice('Settings saved.')
  }

  function updateSchedule(field, value) {
    const nextSettings = { ...settings, [field]: value }
    if (nextSettings.schoolStart >= nextSettings.schoolEnd) {
      setNotice('School closing time must be later than opening time.')
      return
    }
    updateSettings({ [field]: value })
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setNotice('This browser does not support notifications.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      updateSettings({ roomStatusAlerts: true })
      setNotice('Room status alerts are enabled.')
    } else {
      setNotice('Notification permission was not granted.')
    }
  }

  return (
    <DashboardPage icon={SettingsIcon} title="Settings" description="Configure appearance, room views, alerts, schedules, and your staff account.">
      <div className="grid gap-6 xl:grid-cols-2">
        {notice && <div role="status" className="xl:col-span-2 rounded-lg bg-[#e2f5f1] px-4 py-3 text-xs font-bold text-[#087364]">{notice}</div>}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="rounded-lg bg-[#e8f3ff] p-2 text-[#0d8c7a]"><Sun className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-slate-900">Appearance</h3><p className="mt-1 text-xs text-slate-500">Choose how the dashboard looks for this browser.</p></div></div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[{ value: 'light', label: 'Light mode', icon: Sun }, { value: 'dark', label: 'Dark mode', icon: Moon }].map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => updateSettings({ theme: value })} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-bold transition ${settings.theme === value ? 'border-[#0d8c7a] bg-[#e2f5f1] text-[#087364]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}><Icon className="h-4 w-4" />{label}</button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="rounded-lg bg-[#e2f5f1] p-2 text-[#0d8c7a]"><DoorOpen className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-slate-900">Room Display Settings</h3><p className="mt-1 text-xs text-slate-500">Choose which room details appear in room views.</p></div></div>
          <div className="mt-1">
            <SettingToggle checked={settings.showRoomNumbers} onChange={value => updateSettings({ showRoomNumbers: value })} label="Show room numbers" description="Display room names in the rooms directory and building structure." />
            <SettingToggle checked={settings.showInstructors} onChange={value => updateSettings({ showInstructors: value })} label="Show instructors" description="Display assigned instructors next to room details." />
            <SettingToggle checked={settings.showAvailability} onChange={value => updateSettings({ showAvailability: value })} label="Show availability" description="Display each room's current availability status." />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="rounded-lg bg-amber-50 p-2 text-amber-600"><Bell className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-slate-900">Notification Settings</h3><p className="mt-1 text-xs text-slate-500">Get notified when a room changes status.</p></div></div>
          <div className="mt-1"><SettingToggle checked={settings.roomStatusAlerts} onChange={value => value ? enableNotifications() : updateSettings({ roomStatusAlerts: false })} label="Room status alerts" description="Allow browser alerts when automatic updates detect a room status change." /></div>
          <button type="button" onClick={enableNotifications} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Bell className="h-4 w-4" /> Enable browser permission</button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="rounded-lg bg-violet-50 p-2 text-violet-600"><Clock3 className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-slate-900">Schedule Settings</h3><p className="mt-1 text-xs text-slate-500">Set school hours for automatic room refreshes.</p></div></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-700">School opens<input type="time" value={settings.schoolStart} onChange={event => updateSchedule('schoolStart', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-[#0d8c7a]" /></label><label className="text-xs font-bold text-slate-700">School closes<input type="time" value={settings.schoolEnd} onChange={event => updateSchedule('schoolEnd', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-[#0d8c7a]" /></label></div>
          <div className="mt-1"><SettingToggle checked={settings.automaticRoomUpdates} onChange={value => updateSettings({ automaticRoomUpdates: value })} label="Automatic room updates" description="Refresh room statuses every 30 seconds during school hours." /></div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Save className="h-4 w-4 text-[#0d8c7a]" /> Changes are saved automatically.</div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><UserRound className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-slate-900">Account Settings</h3><p className="mt-1 text-xs text-slate-500">Review your staff profile and end this browser session.</p></div></div><button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700"><LogOut className="h-4 w-4" />Log out</button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organization</p><p className="mt-1 text-sm font-bold text-slate-800">{staff?.organizationName || 'Not provided'}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff email</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{staff?.email || 'Not provided'}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account type</p><p className="mt-1 text-sm font-bold text-slate-800">{staff?.accountType || 'Staff administrator'}</p></div></div>
        </section>
      </div>
    </DashboardPage>
  )
}
