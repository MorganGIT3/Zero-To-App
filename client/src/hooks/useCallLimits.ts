import { useState, useEffect, useCallback } from 'react'
import { getUserCallLimits } from '@/lib/supabase'

interface CallLimitsData {
  calls_remaining: number
  calls_used: number
  week_start_date: string
  last_reset_date: string
}

export const useCallLimits = () => {
  const [callsRemaining, setCallsRemaining] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [callLimitsData, setCallLimitsData] = useState<CallLimitsData | null>(null)

  const fetchCallLimits = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getUserCallLimits()
      
      if (data) {
        setCallsRemaining(data.calls_remaining)
        setCallLimitsData(data)
      } else {
        setError('Impossible de récupérer les limites d\'appels')
        setCallsRemaining(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      setCallsRemaining(null)
      console.error('Erreur lors de la récupération des limites d\'appels:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCallLimits()

    // Rafraîchir toutes les 30 secondes pour mettre à jour après un booking
    const interval = setInterval(() => {
      fetchCallLimits()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchCallLimits])

  const refresh = useCallback(() => {
    fetchCallLimits()
  }, [fetchCallLimits])

  return {
    callsRemaining,
    isLoading,
    error,
    refresh,
    callLimitsData
  }
}




