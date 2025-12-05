import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Target, Home, Calendar, User, Mail, Shield, Clock, X, BrainCog, Image, MessageCircle } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { FullScreenCalendar } from './FullScreenCalendar';
import { CalComBookingPage } from './CalComBookingPage';
import { SimpleCalComRedirect } from './SimpleCalComRedirect';
import { SmartAIAssistantSimple as SmartAIAssistant } from './SmartAIAssistantSimple';
import { DiscordPage } from './DiscordPage';
import { ResourcesPage } from './ResourcesPage';
import { ProfilePage } from './ProfilePage';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IosDock } from './IosDock';
import { BentoCard, BentoGrid } from './BentoGrid';

interface NewDashboardAppProps {
  onLogout?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export function NewDashboardApp({ onLogout }: NewDashboardAppProps) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('/dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleLogout = () => {
    onLogout?.();
    navigate('/');
  };

  const loadUserProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Animation des particules (fond de la landing page)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      fadeDelay: number;
      fadeStart: number;
      fadingOut: boolean;
    };

    let particles: Particle[] = [];
    let raf = 0;

    const count = () => Math.floor((canvas.width * canvas.height) / 7000);

    const make = (): Particle => {
      const fadeDelay = Math.random() * 600 + 100;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() / 5 + 0.1,
        opacity: 0.7,
        fadeDelay,
        fadeStart: Date.now() + fadeDelay,
        fadingOut: false,
      };
    };

    const reset = (p: Particle) => {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.speed = Math.random() / 5 + 0.1;
      p.opacity = 0.7;
      p.fadeDelay = Math.random() * 600 + 100;
      p.fadeStart = Date.now() + p.fadeDelay;
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count(); i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, 0.6, Math.random() * 2 + 1);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Désactiver le scroll avec la molette sur toutes les pages et cacher la scrollbar
  useEffect(() => {
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    window.addEventListener('wheel', preventWheel, { passive: false });
    document.body.style.overflow = 'hidden';
    
    // Cacher la scrollbar sur tous les navigateurs
    const style = document.createElement('style');
    style.textContent = `
      * {
        scrollbar-width: none !important; /* Firefox */
        -ms-overflow-style: none !important; /* IE and Edge */
      }
      *::-webkit-scrollbar {
        display: none !important; /* Chrome, Safari, Opera */
        width: 0 !important;
        height: 0 !important;
      }
      html, body {
        overflow: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('wheel', preventWheel);
      document.body.style.overflow = '';
      document.head.removeChild(style);
    };
  }, []);

  const renderContent = () => {
    switch (currentView) {
          case '/dashboard':
            return (
              <motion.div 
                className="h-[calc(100vh-6rem)] flex items-center justify-center overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-full max-w-7xl mx-auto px-8 py-8">
                  {/* Bento Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <BentoGrid>
                      <BentoCard
                        name="Book un Call"
                        description=""
                        cta="Réserver"
                        Icon={Target}
                        className="col-span-1 md:col-span-3"
                        background={<div />}
                        onClick={() => setCurrentView('/book-call')}
                      />
                      <BentoCard
                        name="Discord"
                        description=""
                        cta="Rejoindre"
                        Icon={MessageCircle}
                        className="col-span-1"
                        background={<div />}
                        onClick={() => setCurrentView('/discord')}
                      />
                      <BentoCard
                        name="Smart AI Assistant"
                        description=""
                        cta="Accéder"
                        Icon={BrainCog}
                        className="col-span-1 md:col-span-2"
                        background={<div />}
                        onClick={() => setCurrentView('/ai-assistant')}
                      />
                      <BentoCard
                        name="Formation"
                        description=""
                        cta="Accéder"
                        Icon={Shield}
                        className="col-span-1"
                        background={<div />}
                        href="https://alive-buffer-ca8.notion.site/SmartApp-Academy-Cr-e-lance-et-vends-ton-application-IA-no-code-des-entreprises-en-30-jours-86dc953a59a14aceae127c06e675a098"
                      />
                      <BentoCard
                        name="Ressources graphiques"
                        description=""
                        cta="Accéder"
                        Icon={Image}
                        className="col-span-1"
                        background={<div />}
                        onClick={() => setCurrentView('/resources')}
                      />
                    </BentoGrid>
                  </motion.div>
                </div>
              </motion.div>
            );

          case '/book-call':
            return (
              <div className="min-h-screen">
                <SimpleCalComRedirect />
              </div>
            );

          case '/ai-assistant':
            return (
              <div className="min-h-screen">
                <SmartAIAssistant />
              </div>
            );

          case '/discord':
            return (
              <div className="min-h-screen">
                <DiscordPage />
              </div>
            );

          case '/resources':
            return (
              <div className="min-h-screen">
                <ResourcesPage />
              </div>
            );

          case '/profile':
            return (
              <div className="min-h-screen">
                <ProfilePage onLogout={handleLogout} />
              </div>
            );

      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-4xl mx-auto px-8">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12">
                Bienvenue dans votre espace ZeroToApp
              </p>
        </div>
      </div>
    );
    }
  };

  // Dashboard simplifié - pas besoin de variables complexes

  return (
    <section className="minimal-root-dashboard">
      <style>{`
@import url('https://fonts.cdnfonts.com/css/hubot-sans');

.minimal-root-dashboard {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  --bg: #0a0a0a;
  --fg: #fafafa;
  --muted: #a1a1aa;
  --border: #27272a;
  --accent: #e5e7eb;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Hubot Sans', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
}

.particleCanvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.accent-lines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.accent-lines .hline {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border), transparent);
}

.accent-lines .vline {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--border), transparent);
}
      `}</style>

      {/* Particles Canvas */}
      <canvas ref={canvasRef} className="particleCanvas" />

      {/* Accent Lines */}
      <div className="accent-lines">
        <div className="hline" />
        <div className="vline" />
      </div>

    <div className="min-h-screen w-full relative flex overflow-hidden [&::-webkit-scrollbar]:hidden" style={{ isolation: 'isolate', overflow: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', zIndex: 1 }}>

      {/* Logo ZEROTOAPP en haut à gauche */}
      <div className="fixed top-6 left-6 z-[10000] pointer-events-none" style={{ zIndex: 10000 }}>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
        >
          ZEROTOAPP
        </motion.h1>
      </div>

      {/* Main Content */}
          <main className="flex-1 relative pb-24 overflow-hidden [&::-webkit-scrollbar]:hidden" style={{ border: 'none !important', zIndex: 10, isolation: 'isolate', overflow: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="p-8 overflow-hidden [&::-webkit-scrollbar]:hidden" style={{ border: 'none !important', overflow: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ border: 'none !important', isolation: 'isolate' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* iOS Dock - Toujours au-dessus de tout */}
      <div 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 99999, 
          pointerEvents: 'auto',
          willChange: 'auto',
          backfaceVisibility: 'hidden'
        }}
      >
        <IosDock
          currentView={currentView}
          onNavigate={setCurrentView}
          onProfileClick={() => setCurrentView('/profile')}
          onLogout={onLogout}
        />
      </div>


    </div>
    </section>
  );
}