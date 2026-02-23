import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// You'll need to replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Types for better type safety
export interface Profile {
  id: string
  email: string
  name?: string
  avatar?: string
  language: string
  created_at: string
  updated_at: string
}

export interface ARContent {
  id: string
  user_id: string
  title: string
  description?: string
  type: 'marker' | 'object' | 'text' | 'audio' | 'model'
  position_lat: number
  position_lng: number
  position_alt?: number
  data: any
  is_public: boolean
  created_at: string
  updated_at: string
}

// Auth utilities
export const authUtils = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  getSession: () => {
    return supabase.auth.getSession()
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Profile utilities
export const profileUtils = {
  createProfile: async (userData: Partial<Profile>) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...userData, id: user.id }])
      .select()
      .single()

    return { data, error }
  },

  getProfile: async (userId?: string) => {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id

    if (!targetId) throw new Error('No user ID provided')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single()

    return { data, error }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    return { data, error }
  }
}

// AR Content utilities
export const arContentUtils = {
  // Create new AR content
  createARContent: async (content: Omit<ARContent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('ar_content')
      .insert([{ ...content, user_id: user.id }])
      .select()
      .single()

    return { data, error }
  },

  // Get user's AR content
  getUserARContent: async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('ar_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Get public AR content near location
  getNearbyPublicARContent: async (lat: number, lng: number, radiusKm: number = 10) => {
    const { data, error } = await supabase.rpc('get_nearby_ar_content', {
      center_lat: lat,
      center_lng: lng,
      radius_km: radiusKm
    })

    return { data, error }
  },

  // Update AR content
  updateARContent: async (id: string, updates: Partial<ARContent>) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('ar_content')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    return { data, error }
  },

  // Delete AR content
  deleteARContent: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user')

    const { error } = await supabase
      .from('ar_content')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return { error }
  },

  // Sync local changes
  syncLocalChanges: async (localChanges: any[]) => {
    // This would implement sync logic for local-first architecture
    // Placeholder for now
    console.log('Syncing local changes:', localChanges)
    return { success: true, synced: 0 }
  }
}

// Real-time subscriptions
export const realtimeUtils = {
  subscribeToARContent: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('ar_content_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ar_content'
        },
        callback
      )
      .subscribe()

    return channel
  },

  subscribeToProfile: (userId: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(`profile_${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe()

    return channel
  }
}