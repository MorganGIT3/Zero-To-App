import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LandingPage } from "@/components/LandingPage";
import { Dashboard } from "@/components/Dashboard";
import { Integrations } from "@/components/Integrations";
import { NewDashboardApp } from "@/components/NewDashboardApp";
import { Onboarding } from "@/components/Onboarding";
import { WelcomeOnboardingPage } from "@/components/WelcomeOnboardingPage";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getCurrentUser } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Vérifier l'état basé sur l'URL
  const isOnboarding = location.pathname === '/onboarding';
  const isWelcomeOnboarding = location.pathname === '/welcome-onboarding';
  const isFirstOnboarding = location.pathname === '/first-onboarding';
  const isDashboard = location.pathname === '/dashboard';
  const isLanding = location.pathname === '/' || location.pathname === '/landingpage';

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Ne JAMAIS vérifier l'onboarding si on est déjà sur une page d'onboarding
    // Cela évite les redirections automatiques qui causent l'écran noir
    if (currentPath === '/onboarding' || 
        currentPath === '/welcome-onboarding' || 
        currentPath === '/first-onboarding') {
      setIsCheckingOnboarding(false);
      return;
    }
    
    // Vérifier l'onboarding uniquement si on n'est pas sur une page d'onboarding
    // et uniquement si on est sur le dashboard
    if (currentPath === '/dashboard' || currentPath.startsWith('/dashboard')) {
      checkOnboardingStatus();
    } else {
      setIsCheckingOnboarding(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const checkOnboardingStatus = async () => {
    const currentPath = location.pathname;
    // Ne pas vérifier si on est déjà sur une page d'onboarding
    if (currentPath === '/onboarding' || currentPath === '/welcome-onboarding' || currentPath === '/first-onboarding') {
      setIsCheckingOnboarding(false);
      return;
    }

    try {
      const user = await getCurrentUser();
      // Ne vérifier que si on est sur le dashboard ou une route protégée
      if (user && (currentPath === '/dashboard' || currentPath.startsWith('/dashboard'))) {
        // Vérifier les deux statuts d'onboarding
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_onboarding_completed, onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Si le premier onboarding n'est pas complété, rediriger vers /first-onboarding
          if (!profile.first_onboarding_completed) {
            navigate('/first-onboarding');
            return;
          }
          // Si le premier onboarding est complété mais pas le deuxième, rediriger vers /welcome-onboarding
          if (profile.first_onboarding_completed && !profile.onboarding_completed) {
            navigate('/welcome-onboarding');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'onboarding:', error);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleLogin = async () => {
    // Pour la connexion, vérifier l'onboarding et rediriger en conséquence
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_onboarding_completed, onboarding_completed')
          .eq('user_id', user.id)
          .single();

        // Si pas de profil ou onboarding non complété, rediriger vers welcome-onboarding pour les nouveaux comptes
        if (!profile || !profile.onboarding_completed) {
            navigate('/welcome-onboarding');
            return;
        }
      }
      // Sinon, aller au dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      // En cas d'erreur, rediriger vers welcome-onboarding pour les nouveaux comptes
      navigate('/welcome-onboarding');
    }
  };

  const handleSignup = () => {
    // Pour l'inscription, toujours aller au premier onboarding
    navigate('/first-onboarding');
  };

  const handleFirstOnboardingComplete = () => {
    // Après le premier onboarding, aller à la page de bienvenue
    navigate('/welcome-onboarding');
  };

  const handleWelcomeOnboardingComplete = () => {
    // Après la page de bienvenue, aller au dashboard
    navigate('/dashboard');
  };

  const handleOnboardingComplete = () => {
    // Après la page onboarding, aller au dashboard
    navigate('/dashboard');
  };

  const handleLogout = () => {
    navigate('/landingpage');
  };

  if (isCheckingOnboarding && (isDashboard || location.pathname.startsWith('/dashboard'))) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark">
          <Routes>
            <Route path="/" element={<LandingPage onLogin={handleLogin} onSignup={handleSignup} onGoToWelcomeOnboarding={() => navigate('/welcome-onboarding')} />} />
            <Route path="/landingpage" element={<LandingPage onLogin={handleLogin} onSignup={handleSignup} onGoToWelcomeOnboarding={() => navigate('/welcome-onboarding')} />} />
            <Route 
              path="/first-onboarding" 
              element={
                <ProtectedRoute>
                  <WelcomeOnboarding onContinue={handleFirstOnboardingComplete} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/welcome-onboarding" 
              element={
                <ProtectedRoute>
                  <WelcomeOnboardingPage onContinue={handleWelcomeOnboardingComplete} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <Onboarding onContinue={handleOnboardingComplete} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <NewDashboardApp onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
