import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Phone, AlertCircle } from "lucide-react"
import { getCurrentUser, getUserCallLimits, type UserCallLimits } from "@/lib/supabase"
import { ShinyButton } from "./ShinyButton"

export function SimpleCalComRedirect() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [callLimits, setCallLimits] = useState<UserCallLimits | null>(null)
  const [isLoading, setIsLoading] = useState(true)


  // Charger les données de l'utilisateur au montage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user && user.email) {
          setUserEmail(user.email)
        }

        const limits = await getUserCallLimits()
        if (limits) {
          setCallLimits(limits)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  // Désactiver le scroll avec la molette
  useEffect(() => {
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault()
    }

    window.addEventListener('wheel', preventWheel, { passive: false })
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('wheel', preventWheel)
      document.body.style.overflow = ''
    }
  }, [])

  const handleButtonClick = () => {
    // Vérifier s'il reste des appels
    if (callLimits && callLimits.calls_remaining <= 0) {
      alert('❌ Vous avez atteint votre limite de 2 appels pour cette semaine. Vos appels se rechargeront lundi prochain.')
      return
    }
    setShowConfirmation(true)
  }

  const handleConfirm = () => {
    setIsRedirecting(true)
    // Rediriger vers cal.com avec l'email pré-rempli
    const calComUrl = `https://cal.com/zerotoapp/1h-d-accompagnement?email=${encodeURIComponent(userEmail)}`
    window.location.href = calComUrl
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      
      {/* Contenu principal */}
      <div className="relative z-10 flex items-center justify-center w-full p-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          {/* Icône animée moderne */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="mb-8 mx-auto w-24 h-24 backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#a78bfa]/20 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Phone className="h-12 w-12 text-[#a78bfa] relative z-10" />
          </motion.div>

          {/* Titre avec effet moderne */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-2">
              Réserve tes appels de la semaine
            </h1>
            <motion.div 
              className="h-px bg-gradient-to-r from-transparent via-[#a78bfa]/40 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-white/60 mb-8"
          >
            Un moment privilégié pour échanger et avancer ensemble
          </motion.p>

          {/* Affichage du nombre d'appels restants */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-6 flex justify-center"
          >
            <div className="backdrop-blur-2xl bg-white/[0.05] border border-white/[0.10] rounded-xl px-6 py-3 flex items-center gap-3 shadow-lg">
              <Phone className="h-5 w-5 text-[#a78bfa]" />
              {isLoading ? (
                <span className="text-white/60 text-sm">Chargement...</span>
              ) : (
                <span className="text-white/90 font-medium text-sm">
                  Il vous reste{' '}
                  <span className="text-[#a78bfa] font-bold text-base">
                    {callLimits?.calls_remaining ?? 0}
                  </span>{' '}
                  appel{callLimits?.calls_remaining !== 1 ? 's' : ''} cette semaine
                </span>
              )}
            </div>
          </motion.div>

          {/* Bouton principal moderne */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
            className="flex justify-center mt-4"
          >
            <ShinyButton
              onClick={handleButtonClick}
              className="flex items-center justify-center gap-3 px-6 py-3 text-sm w-auto"
            >
              <Calendar className="h-5 w-5" />
              <span>Booker un appel</span>
            </ShinyButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Popup de confirmation personnalisée */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay sombre */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />
          
          {/* Contenu de la popup */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-2xl shadow-2xl max-w-xs w-full mx-4 p-4"
          >
            {/* Message */}
            <h2 className="text-sm font-semibold mb-3 text-white text-center">
              Confirmation
            </h2>
            
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 mb-3">
              <p className="text-white/70 text-xs leading-relaxed text-center">
                Il vous restera <span className="font-bold text-[#a78bfa]">{(callLimits?.calls_remaining ?? 2) - 1} appel{((callLimits?.calls_remaining ?? 2) - 1) > 1 ? 's' : ''}</span> cette semaine.
              </p>
              <p className="text-[#a78bfa] text-xs font-medium mt-2 text-center">
                📅 Rechargement lundi
              </p>
            </div>

            {/* Message important avec email */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 mb-3">
              <p className="text-white/80 font-semibold text-xs text-center mb-2">
                ⚠️ Utilisez le même email
              </p>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-2 mt-2">
                <p className="text-white/60 text-[10px] mb-1 text-center">Email :</p>
                <p className="text-[#a78bfa] font-bold text-[11px] text-center break-all">
                  {userEmail || 'Chargement...'}
                </p>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.10] text-white/70 rounded-xl text-xs font-medium transition-colors"
              >
                Annuler
              </motion.button>
              
              <ShinyButton
                onClick={handleConfirm}
                disabled={isRedirecting}
                className="px-4 py-2 text-xs flex items-center gap-1.5"
              >
                {isRedirecting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span className="text-[10px]">Redirection...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3" />
                    <span>Continuer</span>
                  </>
                )}
              </ShinyButton>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}
