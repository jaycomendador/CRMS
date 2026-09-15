import { useEffect, useState } from 'react'

export const SETTINGS_STORAGE_KEY = 'crms_dashboard_settings'
export const SETTINGS_EVENT = 'crms-settings-changed'

export const DEFAULT_SETTINGS = {
  theme: 'light',
  showRoomNumbers: true,
  showInstructors: true,
  showAvailability: true,
  roomStatusAlerts: true,
  schoolStart: '08:00',
  schoolEnd: '18:00',
  automaticRoomUpdates: true
}

export function getSettings() {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(nextSettings) {
  const settings = { ...DEFAULT_SETTINGS, ...nextSettings }
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {}
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }))
  return settings
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
}

export function isWithinSchoolHours(settings = getSettings(), date = new Date()) {
  const currentTime = date.toTimeString().slice(0, 5)
  return currentTime >= settings.schoolStart && currentTime <= settings.schoolEnd
}

export function useDashboardSettings() {
  const [settings, setSettings] = useState(getSettings)

  useEffect(() => {
    function handleSettingsChange(event) {
      setSettings(event.detail || getSettings())
    }

    window.addEventListener(SETTINGS_EVENT, handleSettingsChange)
    return () => window.removeEventListener(SETTINGS_EVENT, handleSettingsChange)
  }, [])

  return settings
}
