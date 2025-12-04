import { useState } from 'react';
import LandingPageNew from './LandingPageNew';
import { AuthModal } from './AuthModal';
import { OTPVerification } from './OTPVerification';
import AnimatedBackground from './AnimatedBackground';
import { Zap } from 'lucide-react';
import { useClickSound } from '@/hooks/useClickSound';

interface LandingPageProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onGoToWelcomeOnboarding?: () => void;
}

export function LandingPage({ onLogin, onSignup, onGoToWelcomeOnboarding }: LandingPageProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const playClick = useClickSound(0.3);

  const handleAuthSuccess = () => {
    // Fermer immédiatement le modal
    setAuthModalOpen(false);
    // Pour la connexion, aller directement au dashboard (vérification de l'onboarding dans App.tsx)
    onLogin?.();
  };

  const handleSignupSuccess = () => {
    // Fermer immédiatement le modal
    setAuthModalOpen(false);
    // Pour l'inscription, aller à l'onboarding
    onSignup?.();
  };

  const handleOpenAuthModal = (tab: "login" | "signup") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };


  return (
    <div className="relative min-h-screen bg-black">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Logo seulement en haut à gauche */}
      <div className="absolute top-0 left-0 z-10 p-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 via-[#a78bfa] to-purple-300 shadow-lg shadow-[#a78bfa]/50 drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-xl text-white">ZeroToApp</span>
        </div>
      </div>

      {/* Bouton Admin discret en haut à droite */}
      <div className="absolute top-0 right-0 z-30 p-6">
        <button 
          onClick={() => { setOtpModalOpen(true); }}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors duration-200 opacity-30 hover:opacity-60 cursor-pointer"
          title="Accès Admin"
        >
          Admin
        </button>
      </div>

      {/* New Landing Page Content */}
      <div className="relative z-20">
        <LandingPageNew 
          onLogin={() => handleOpenAuthModal("login")}
          onSignup={() => handleOpenAuthModal("signup")}
          onGoToOnboarding={onGoToWelcomeOnboarding || handleAuthSuccess}
        />
      </div>

      {/* Modals */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
        onSignupSuccess={handleSignupSuccess}
        defaultTab={authModalTab}
      />
      
      {/* OTP Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ border: 'none', outline: 'none' }}>
          <div className="absolute inset-0 bg-black/80" onClick={() => setOtpModalOpen(false)} />
          <div className="relative z-10" style={{ border: 'none', outline: 'none' }}>
            <OTPVerification 
              onSuccess={() => {
                console.log("Accès admin accordé!")
                setOtpModalOpen(false)
                // Rediriger vers le dashboard admin
                window.location.href = '/admin-dashboard'
              }}
              onClose={() => setOtpModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}