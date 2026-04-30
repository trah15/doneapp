import { createClient } from '@supabase/supabase-js'
import ElectronStore from 'electron-store'

const SUPABASE_URL = 'https://eevmqvzhysizidplqxvk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldm1xdnpoeXNpemlkcGxxeHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjg5MTMsImV4cCI6MjA4OTk0NDkxM30._MQ9fSAG8lkYWm_fxRp8gUwJGbxfFYFGKMAV3y8OIHg'

const store = new ElectronStore({
  name: 'auth'
})

const storageAdapter = {
  getItem(key) {
    return store.get(key) ?? null
  },
  setItem(key, value) {
    store.set(key, value)
  },
  removeItem(key) {
    store.delete(key)
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: storageAdapter
  }
})