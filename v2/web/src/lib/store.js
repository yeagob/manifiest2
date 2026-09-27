import { create } from 'zustand'
import { api, refreshSession, onSessionChange } from './api.js'

export const useSession = create((set, get) => ({
  ready: false,
  profile: null,
  async boot() {
    if (get().ready) return
    if (await refreshSession()) await get().reload()
    set({ ready: true })
  },
  async reload() {
    try {
      set({ profile: await api.me() })
    } catch {
      set({ profile: null })
    }
  },
  setProfile(profile) {
    set({ profile })
  },
  async logout() {
    await api.logout()
    set({ profile: null })
  }
}))

onSessionChange(active => {
  if (!active) useSession.setState({ profile: null })
})
