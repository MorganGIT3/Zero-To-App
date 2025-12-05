import { createClient } from '@supabase/supabase-js'

// Configuration Supabase - Nouveau projet
const supabaseUrl = 'https://kwzurhhbvfkrvhbcdhwi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3enVyaGhidmZrcnZoYmNkaHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODU0OTAsImV4cCI6MjA3NTM2MTQ5MH0.UmcUdRYx9IawGI93Ylqe40LyjAeYHDhrYKLwL0yAifQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Codes admin avec différents niveaux d'accès
const ADMIN_CODES = {
  'admin123': { 
    name: 'Admin Principal', 
    level: 'admin', 
    description: 'Accès administrateur standard',
    permissions: ['read', 'write', 'delete']
  },
  'smartapp2024': { 
    name: 'SmartApp 2024', 
    level: 'admin', 
    description: 'Accès ZeroToApp 2024',
    permissions: ['read', 'write']
  },
  'academy2024': { 
    name: 'Academy 2024', 
    level: 'admin', 
    description: 'Accès académie 2024',
    permissions: ['read', 'write']
  },
  'master2024': { 
    name: 'Master 2024', 
    level: 'super_admin', 
    description: 'Accès master avec privilèges étendus',
    permissions: ['read', 'write', 'delete', 'admin_manage']
  },
  'superadmin': { 
    name: 'Super Admin', 
    level: 'super_admin', 
    description: 'Accès super administrateur',
    permissions: ['read', 'write', 'delete', 'admin_manage', 'system_manage']
  }
}

// Fonction pour vérifier le code admin via Supabase
export const verifyAdminCode = async (code: string): Promise<{ valid: boolean; adminInfo?: any }> => {
  try {
    const normalizedCode = code.toLowerCase().trim()
    
    // Vérifier d'abord dans les codes locaux (fallback)
    const localAdminInfo = ADMIN_CODES[normalizedCode as keyof typeof ADMIN_CODES]
    if (localAdminInfo) {
      console.log(`Accès admin accordé (local): ${localAdminInfo.name} (${localAdminInfo.level})`)
      
      // Stocker les infos admin dans le localStorage pour la session
      localStorage.setItem('admin_session', JSON.stringify({
        code: normalizedCode,
        ...localAdminInfo,
        loginTime: new Date().toISOString()
      }))
      
      return { valid: true, adminInfo: localAdminInfo }
    }
    
    // Essayer de vérifier via Supabase
    try {
      const { data, error } = await supabase
        .from('admin_codes')
        .select('*')
        .eq('code', normalizedCode)
        .eq('is_active', true)
        .single()
      
      if (error || !data) {
        return { valid: false }
      }
      
      // Vérifier les limites d'utilisation
      if (data.max_uses && data.used_count >= data.max_uses) {
        console.log('Code admin épuisé')
        return { valid: false }
      }
      
      // Vérifier l'expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        console.log('Code admin expiré')
        return { valid: false }
      }
      
      // Incrémenter le compteur d'utilisation
      await supabase
        .from('admin_codes')
        .update({ used_count: data.used_count + 1 })
        .eq('id', data.id)
      
      const adminInfo = {
        name: data.name,
        level: data.level,
        description: data.description,
        permissions: data.level === 'super_admin' 
          ? ['read', 'write', 'delete', 'admin_manage', 'system_manage']
          : ['read', 'write', 'delete']
      }
      
      console.log(`Accès admin accordé (Supabase): ${adminInfo.name} (${adminInfo.level})`)
      
      // Stocker les infos admin dans le localStorage pour la session
      localStorage.setItem('admin_session', JSON.stringify({
        code: normalizedCode,
        ...adminInfo,
        loginTime: new Date().toISOString()
      }))
      
      return { valid: true, adminInfo }
      
    } catch (supabaseError) {
      console.log('Supabase non disponible, utilisation des codes locaux')
      return { valid: false }
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification du code admin:', error)
    return { valid: false }
  }
}

// Fonction pour obtenir la session admin actuelle
export const getCurrentAdminSession = () => {
  try {
    const session = localStorage.getItem('admin_session')
    if (session) {
      const adminData = JSON.parse(session)
      // Vérifier si la session n'est pas expirée (24h)
      const loginTime = new Date(adminData.loginTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff < 24) {
        return adminData
      } else {
        localStorage.removeItem('admin_session')
        return null
      }
    }
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération de la session admin:', error)
    return null
  }
}

// Fonction pour déconnecter l'admin
export const logoutAdmin = () => {
  localStorage.removeItem('admin_session')
  console.log('Session admin fermée')
}

// Fonction pour créer un utilisateur
export const signUpUser = async (email: string, password: string, fullName?: string) => {
  try {
    console.log('Tentative d\'inscription pour:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || ''
        }
      }
    })
    
    console.log('Réponse Supabase Auth:', { data, error })
    
    if (error) {
      console.error('Erreur Supabase Auth:', error)
      return { data, error }
    }
    
    if (data.user) {
      console.log('Utilisateur créé avec succès:', data.user.id)
      console.log('Le profil utilisateur et les paramètres seront créés automatiquement par le trigger PostgreSQL')
    }
    
    return { data, error }
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return { data: null, error }
  }
}

// Fonction pour connecter un utilisateur
export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    return { data: null, error }
  }
}

// Fonction pour déconnecter un utilisateur
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    return { error }
  }
}

// Fonction pour réinitialiser le mot de passe
export const resetPassword = async (email: string) => {
  try {
    console.log('Demande de réinitialisation de mot de passe pour:', email)
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    console.log('Réponse réinitialisation:', { data, error })
    
    if (error) {
      console.error('Erreur réinitialisation:', error)
      return { data, error }
    }
    
    console.log('Email de réinitialisation envoyé avec succès')
    return { data, error }
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    return { data: null, error }
  }
}

// Fonction pour obtenir l'utilisateur actuel
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return null
  }
}

// ===== FONCTIONS CALENDRIER =====

// Interface pour les événements du calendrier
export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  is_all_day: boolean
  event_type: 'appointment' | 'meeting' | 'call' | 'task' | 'reminder' | 'personal'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  color: string
  location?: string
  participants?: any[]
  notes?: string
  created_at: string
  updated_at: string
}

// Récupérer tous les événements d'un utilisateur pour une période donnée
export const getCalendarEvents = async (startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })

    if (startDate && endDate) {
      query = query
        .gte('event_date', startDate.toISOString().split('T')[0])
        .lte('event_date', endDate.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des événements:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erreur dans getCalendarEvents:', error)
    return []
  }
}

// Créer un nouvel événement
export const createCalendarEvent = async (eventData: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...eventData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de l\'événement:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erreur dans createCalendarEvent:', error)
    return null
  }
}

// Mettre à jour un événement
export const updateCalendarEvent = async (eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .update(eventData)
      .eq('id', eventId)
      .eq('user_id', user.id) // Sécurité : s'assurer que l'utilisateur ne peut modifier que ses événements
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erreur dans updateCalendarEvent:', error)
    return null
  }
}

// Supprimer un événement
export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id) // Sécurité : s'assurer que l'utilisateur ne peut supprimer que ses événements

    if (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur dans deleteCalendarEvent:', error)
    return false
  }
}

// ===== FONCTIONS CAL.COM =====

// Configuration Cal.com
const CAL_COM_USERNAME = 'smartapp-academy' // Remplacez par votre nom d'utilisateur Cal.com

// Interface pour les événements Cal.com
export interface CalComEvent {
  id: number
  title: string
  description?: string
  startTime: string
  endTime: string
  attendees: Array<{
    email: string
    name?: string
    timeZone?: string
  }>
  eventType: {
    id: number
    title: string
    length: number
    slug: string
  }
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED'
  location?: string
  uid: string
}

// Interface pour les types d'événements Cal.com (simplifiée)
export interface CalComEventType {
  id: string
  title: string
  slug: string
  length: number
  description?: string
  price?: string
}

// Types d'événements prédéfinis (vous pouvez les personnaliser)
export const getCalComEventTypes = async (): Promise<CalComEventType[]> => {
  // Retourner des types d'événements prédéfinis
  return [
    {
      id: 'audit-gratuit',
      title: 'Audit Gratuit',
      slug: 'audit-gratuit',
      length: 30,
      description: 'Analyse complète de votre stratégie marketing actuelle',
      price: 'Gratuit'
    },
    {
      id: 'strategie-personnalisee',
      title: 'Stratégie Personnalisée',
      slug: 'strategie-personnalisee',
      length: 60,
      description: 'Plan d\'action sur mesure pour votre entreprise',
      price: 'Sur devis'
    },
    {
      id: 'formation-ia',
      title: 'Formation IA',
      slug: 'formation-ia',
      length: 45,
      description: 'Formation sur l\'utilisation de l\'IA dans le marketing',
      price: 'Sur devis'
    }
  ]
}

// Obtenir l'URL Cal.com pour un type d'événement
export const getCalComBookingUrl = (eventSlug: string): string => {
  return `https://cal.com/${CAL_COM_USERNAME}/${eventSlug}`
}

// Obtenir l'URL principale Cal.com
export const getCalComMainUrl = (): string => {
  return `https://cal.com/${CAL_COM_USERNAME}`
}

// ===== FONCTIONS TOKENS UTILISATEURS =====

// Interface pour les tokens utilisateur
export interface UserTokens {
  id: string
  user_id: string
  tokens_available: number
  tokens_used: number
  last_reset_date: string
  created_at: string
  updated_at: string
}

// Récupérer les tokens d'un utilisateur
export const getUserTokens = async (): Promise<UserTokens | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erreur lors de la récupération des tokens:', error)
      throw error
    }

    // Si l'utilisateur n'a pas d'enregistrement, en créer un
    if (!data) {
      const { data: newTokens, error: insertError } = await supabase
        .from('user_tokens')
        .insert({
          user_id: user.id,
          tokens_available: 1,
          tokens_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erreur lors de la création des tokens:', insertError)
        throw insertError
      }

      return newTokens
    }

    return data
  } catch (error) {
    console.error('Erreur dans getUserTokens:', error)
    return null
  }
}

// Utiliser un token pour réserver un appel
export const useBookingToken = async (): Promise<{ success: boolean; message: string; tokensRemaining?: number }> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    // Appeler la fonction PostgreSQL pour utiliser un token
    const { data, error } = await supabase.rpc('use_booking_token', {
      user_uuid: user.id
    })

    if (error) {
      console.error('Erreur lors de l\'utilisation du token:', error)
      throw error
    }

    // Récupérer les tokens mis à jour
    const updatedTokens = await getUserTokens()

    if (data) {
      return {
        success: true,
        message: 'Token utilisé avec succès',
        tokensRemaining: updatedTokens?.tokens_available || 0
      }
    } else {
      return {
        success: false,
        message: 'Aucun token disponible. Vos tokens se rechargent tous les lundis.',
        tokensRemaining: updatedTokens?.tokens_available || 0
      }
    }
  } catch (error) {
    console.error('Erreur dans useBookingToken:', error)
    return {
      success: false,
      message: 'Erreur lors de l\'utilisation du token'
    }
  }
}

// Réinitialiser manuellement les tokens (pour les tests)
export const resetUserTokens = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { error } = await supabase
      .from('user_tokens')
      .update({
        tokens_available: 1,
        tokens_used: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la réinitialisation des tokens:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur dans resetUserTokens:', error)
    return false
  }
}

// ===== FONCTIONS NOTES D'APPELS =====

// Interface pour les notes d'appels
export interface CallNote {
  id: string
  call_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// Interface pour les détails d'appel
export interface CallDetails {
  id: string
  user_id: string
  call_date: string
  call_time: string
  call_duration: string
  call_type: string
  status: 'scheduled' | 'completed' | 'cancelled'
  cal_com_event_id?: string
  created_at: string
  updated_at: string
}

// Récupérer les détails d'un appel
export const getCallDetails = async (callId: string): Promise<CallDetails | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_details')
      .select('*')
      .eq('id', callId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération des détails d\'appel:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erreur dans getCallDetails:', error)
    return null
  }
}

// Créer ou mettre à jour les détails d'un appel
export const upsertCallDetails = async (callData: Omit<CallDetails, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CallDetails | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_details')
      .upsert({
        ...callData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la sauvegarde des détails d\'appel:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erreur dans upsertCallDetails:', error)
    return null
  }
}

// Récupérer toutes les notes d'un appel
export const getCallNotes = async (callId: string): Promise<CallNote[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_notes')
      .select('*')
      .eq('call_id', callId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des notes:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erreur dans getCallNotes:', error)
    return []
  }
}

// Créer une nouvelle note
export const createCallNote = async (callId: string, content: string): Promise<CallNote | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_notes')
      .insert({
        call_id: callId,
        user_id: user.id,
        content: content.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de la note:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erreur dans createCallNote:', error)
    return null
  }
}

// Mettre à jour une note
export const updateCallNote = async (noteId: string, content: string): Promise<CallNote | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_notes')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de la note:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erreur dans updateCallNote:', error)
    return null
  }
}

// Supprimer une note
export const deleteCallNote = async (noteId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { error } = await supabase
      .from('call_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la suppression de la note:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur dans deleteCallNote:', error)
    return false
  }
}

// Récupérer tous les appels d'un utilisateur
export const getUserCalls = async (): Promise<CallDetails[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_details')
      .select('*')
      .eq('user_id', user.id)
      .order('call_date', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des appels:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erreur dans getUserCalls:', error)
    return []
  }
}

// ===== FONCTIONS HISTORIQUE DES APPELS =====

// Interface pour l'historique des appels
export interface CallHistory {
  id: string
  user_id: string
  call_date: string
  call_type: 'weekly_call' | 'consultation' | 'support' | 'other'
  duration_minutes?: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  cal_com_event_id?: string
  created_at: string
  updated_at: string
}

// Récupérer l'historique des appels d'un utilisateur
export const getCallHistory = async (): Promise<CallHistory[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_history')
      .select('*')
      .eq('user_id', user.id)
      .order('call_date', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erreur dans getCallHistory:', error)
    return []
  }
}

// Ajouter un appel à l'historique
export const addCallToHistory = async (callData: {
  call_date: string
  call_type?: 'weekly_call' | 'consultation' | 'support' | 'other'
  duration_minutes?: number
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  cal_com_event_id?: string
}): Promise<CallHistory | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('call_history')
      .insert({
        user_id: user.id,
        ...callData
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de l\'ajout de l\'appel:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erreur dans addCallToHistory:', error)
    return null
  }
}

// Mettre à jour les notes d'un appel
export const updateCallNotes = async (callId: string, notes: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { error } = await supabase
      .from('call_history')
      .update({ 
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', callId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la mise à jour des notes:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur dans updateCallNotes:', error)
    return false
  }
}

// Supprimer un appel de l'historique
export const deleteCallFromHistory = async (callId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { error } = await supabase
      .from('call_history')
      .delete()
      .eq('id', callId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la suppression de l\'appel:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur dans deleteCallFromHistory:', error)
    return false
  }
}

// ===== FONCTIONS LIMITATION D'APPELS =====

// Interface pour les limites d'appels
export interface UserCallLimits {
  calls_remaining: number
  calls_used: number
  week_start_date: string
  last_reset_date: string
}

// Récupérer les limites d'appels de l'utilisateur connecté
export const getUserCallLimits = async (): Promise<UserCallLimits | null> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase.rpc('get_user_call_limits', {
      p_user_id: user.id
    })

    if (error) {
      console.error('Erreur lors de la récupération des limites:', error)
      throw error
    }

    return data as UserCallLimits
  } catch (error) {
    console.error('Erreur dans getUserCallLimits:', error)
    return null
  }
}

// Utiliser un appel (décrémenter)
export const useCall = async (bookingId: string): Promise<{ success: boolean; message: string; calls_remaining?: number }> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase.rpc('use_call', {
      p_user_id: user.id,
      p_booking_id: bookingId
    })

    if (error) {
      console.error('Erreur lors de l\'utilisation d\'un appel:', error)
      throw error
    }

    return data as { success: boolean; message: string; calls_remaining?: number }
  } catch (error) {
    console.error('Erreur dans useCall:', error)
    return {
      success: false,
      message: 'Erreur lors de l\'enregistrement de l\'appel'
    }
  }
}

// Enregistrer un booking Cal.com
export const recordCalComBooking = async (bookingData: {
  booking_id: string
  email: string
  name?: string
  booking_date: string
  event_type?: string
  status?: string
}): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    // Vérifier que l'email correspond
    if (user.email?.toLowerCase() !== bookingData.email.toLowerCase()) {
      throw new Error('L\'email du booking ne correspond pas à votre compte')
    }

    const { error } = await supabase
      .from('calcom_bookings')
      .insert({
        user_id: user.id,
        booking_id: bookingData.booking_id,
        email: bookingData.email,
        name: bookingData.name,
        booking_date: bookingData.booking_date,
        event_type: bookingData.event_type,
        status: bookingData.status || 'scheduled'
      })

    if (error) {
      console.error('Erreur lors de l\'enregistrement du booking:', error)
      throw error
    }

    // Décrémenter le nombre d'appels
    await useCall(bookingData.booking_id)

    return true
  } catch (error) {
    console.error('Erreur dans recordCalComBooking:', error)
    return false
  }
}

// Synchroniser les bookings Cal.com via API
export const syncCalComBookings = async (): Promise<{
  success: boolean
  message: string
  synced: number
}> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    if (!user.email) {
      throw new Error('Email utilisateur non disponible')
    }

    const CAL_API_KEY = 'cal_live_cb7eee1f2fd61ca73b6e09755eaf2ee3'
    const CAL_API_URL = 'https://api.cal.com/v1/bookings'

    // Récupérer les bookings des 30 derniers jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0] // Format YYYY-MM-DD

    const response = await fetch(
      `${CAL_API_URL}?startDate=${startDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erreur API Cal.com:', errorText)
      throw new Error(`Erreur API Cal.com: ${response.status} ${response.statusText}`)
    }

    const bookingsData = await response.json()
    // L'API Cal.com peut retourner les bookings dans différents formats
    const bookings = bookingsData.bookings || bookingsData.data || bookingsData || []

    let syncedCount = 0

    // Filtrer les bookings pour cet utilisateur
    const userBookings = bookings.filter((booking: any) => {
      const attendeeEmail = booking.attendees?.[0]?.email?.toLowerCase()
      return attendeeEmail === user.email?.toLowerCase()
    })

    // Pour chaque booking, vérifier s'il existe déjà et décrémenter si nécessaire
    for (const booking of userBookings) {
      const bookingId = booking.uid
      const attendeeEmail = booking.attendees?.[0]?.email
      const attendeeName = booking.attendees?.[0]?.name
      const startTime = booking.startTime
      const eventType = booking.eventType?.title || booking.title
      const status = booking.status || 'scheduled'

      // Vérifier si le booking existe déjà
      const { data: existingBooking } = await supabase
        .from('calcom_bookings')
        .select('id, user_id')
        .eq('booking_id', bookingId)
        .single()

      if (!existingBooking) {
        // Enregistrer le nouveau booking
        const { error: insertError } = await supabase
          .from('calcom_bookings')
          .insert({
            user_id: user.id,
            booking_id: bookingId,
            email: attendeeEmail,
            name: attendeeName,
            booking_date: startTime,
            event_type: eventType,
            status: status
          })

        if (!insertError) {
          // Décrémenter les appels si le booking est récent (pas déjà compté)
          const bookingDate = new Date(startTime)
          const now = new Date()
          const daysDiff = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)

          // Si le booking est dans les 7 derniers jours, décrémenter
          if (daysDiff <= 7 && status !== 'cancelled') {
            await useCall(bookingId)
          }

          syncedCount++
        }
      }
    }

    return {
      success: true,
      message: `${syncedCount} booking(s) synchronisé(s)`,
      synced: syncedCount
    }
  } catch (error) {
    console.error('Erreur dans syncCalComBookings:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la synchronisation',
      synced: 0
    }
  }
}

// ===== FONCTIONS CHATBOT IA =====

// Interface pour les conversations IA
export interface AIConversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

// Interface pour les messages IA
export interface AIMessage {
  id: string
  conversation_id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  created_at: string
}

// Interface pour le system prompt
export interface AISystemPrompt {
  id: string
  name: string
  prompt: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Récupérer toutes les conversations d'un utilisateur
export const getAIConversations = async (): Promise<AIConversation[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des conversations:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erreur dans getAIConversations:', error)
    return []
  }
}

// Récupérer les messages d'une conversation
export const getAIMessages = async (conversationId: string): Promise<AIMessage[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des messages:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erreur dans getAIMessages:', error)
    return []
  }
}

// Envoyer un message à l'IA
export const sendAIMessage = async (
  userMessage: string,
  conversationId?: string
): Promise<{ success: boolean; conversationId?: string; answer?: string; error?: string }> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    // Récupérer la session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Session expirée')
    }

    // Appeler la Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ai-answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId,
          userMessage: userMessage,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erreur lors de la communication avec l\'IA')
    }

    const data = await response.json()

    return {
      success: true,
      conversationId: data.conversationId,
      answer: data.answer
    }
  } catch (error) {
    console.error('Erreur dans sendAIMessage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Supprimer une conversation
export const deleteAIConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la suppression de la conversation:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur dans deleteAIConversation:', error)
    return false
  }
}

// Récupérer le system prompt actif
export const getActiveSystemPrompt = async (): Promise<AISystemPrompt | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_system_prompts')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération du system prompt:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur dans getActiveSystemPrompt:', error)
    return null
  }
}

// Mettre à jour le system prompt (admin uniquement)
export const updateSystemPrompt = async (promptId: string, newPrompt: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ai_system_prompts')
      .update({ 
        prompt: newPrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', promptId)

    if (error) {
      console.error('Erreur lors de la mise à jour du system prompt:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur dans updateSystemPrompt:', error)
    return false
  }
}
