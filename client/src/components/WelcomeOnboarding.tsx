"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { motion, AnimatePresence } from 'framer-motion';
import { useDramaticSound } from '@/hooks/useDramaticSound';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { ShinyButton } from './ShinyButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Check, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './auth-card.css';

gsap.registerPlugin(SplitText, useGSAP);

interface WelcomeOnboardingProps {
  onContinue: () => void;
}

export function WelcomeOnboarding({ onContinue }: WelcomeOnboardingProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playDramaticSound } = useDramaticSound();
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [discordCodeCopied, setDiscordCodeCopied] = useState(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const splitInstanceRef = useRef<SplitText | null>(null);

  const discordCode = "REJOINS_DISCORD_MAINTENANT"; // Code Discord d'invitation
  const discordInviteUrl = "https://discord.gg/YOUR_INVITE_CODE"; // Remplacez par votre vrai lien Discord

  useEffect(() => {
    const canvas = canvasRef.current!;
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

  useEffect(() => {
    loadUserFirstName();
  }, []);

  // Nettoyer SplitText lors du démontage
  useEffect(() => {
    return () => {
      if (splitInstanceRef.current) {
        try {
          splitInstanceRef.current.revert();
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
        splitInstanceRef.current = null;
      }
    };
  }, []);

  const loadUserFirstName = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        if (profile?.full_name) {
          const firstName = profile.full_name.split(' ')[0];
          const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
          setUserFirstName(capitalizedFirstName);
          return;
        }

        const emailFirstName = user.email?.split('@')[0].split('.')[0] || '';
        const capitalizedEmailFirstName = emailFirstName.charAt(0).toUpperCase() + emailFirstName.slice(1).toLowerCase();
        setUserFirstName(capitalizedEmailFirstName);
      }
    } catch (error) {
      console.log('Erreur lors du chargement du prénom:', error);
    }
  };

  useGSAP(() => {
    if (!titleRef.current) return;

    // Nettoyer l'instance précédente de SplitText
    if (splitInstanceRef.current) {
      try {
        splitInstanceRef.current.revert();
      } catch (e) {
        // Ignorer les erreurs de nettoyage
      }
      splitInstanceRef.current = null;
    }

    // Attendre que les polices soient chargées et que React ait fini de rendre
    const timer = setTimeout(() => {
      if (!titleRef.current) return;

      try {
        const split = new SplitText(titleRef.current, {
          type: 'lines',
          wordsClass: 'lines',
        });

        splitInstanceRef.current = split;

        gsap.set(split.lines, {
          filter: 'blur(16px)',
          yPercent: 30,
          autoAlpha: 0,
          scale: 1.06,
          transformOrigin: '50% 100%',
        });

        gsap.to(split.lines, {
          filter: 'blur(0px)',
          yPercent: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: 'power3.out',
          delay: 0.5,
        });
      } catch (error) {
        console.error('Erreur SplitText:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (splitInstanceRef.current) {
        try {
          splitInstanceRef.current.revert();
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
        splitInstanceRef.current = null;
      }
    };
  }, { scope: sectionRef, dependencies: [currentStep, userFirstName] });

  const handleContinue = () => {
    if (currentStep < features.length) {
      playDramaticSound();
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière étape, ouvrir la popup Discord
      playDramaticSound();
      setShowDiscordModal(true);
    }
  };

  const handleDiscordModalClose = async () => {
    setShowDiscordModal(false);
    // Marquer le premier onboarding comme complété
    await markFirstOnboardingComplete();
    // Rediriger vers la page de bienvenue (welcome-onboarding)
    navigate('/welcome-onboarding');
  };

  const handleGoBack = () => {
    if (currentStep > 0) {
      playDramaticSound();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoBackFromModal = () => {
    setShowDiscordModal(false);
    // Revenir à la dernière étape de l'onboarding
    setCurrentStep(features.length);
  };

  const markFirstOnboardingComplete = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Mettre à jour le profil utilisateur pour indiquer que le premier onboarding est complété
        const { error } = await supabase
          .from('user_profiles')
          .update({ first_onboarding_completed: true })
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Erreur lors de la mise à jour du profil:', error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  const copyDiscordCode = () => {
    navigator.clipboard.writeText(discordCode);
    setDiscordCodeCopied(true);
    setTimeout(() => setDiscordCodeCopied(false), 2000);
  };

  const handleJoinDiscord = () => {
    window.open(discordInviteUrl, "_blank", "noopener,noreferrer");
  };

  const features = [
    {
      title: "Accompagnement personnalisé",
      description: "Deux appels par semaine pour t'accompagner au mieux à vendre ta première app no-code à une entreprise"
    },
    {
      title: "Appels d'accompagnement",
      description: "Des appels d'accompagnement avec Yohan ou MorganRize pour t'aider à progresser et atteindre tes objectifs"
    },
    {
      title: "Ressources de design",
      description: "Un accès à des sites de design que tu peux intégrer à ton app pour créer des interfaces professionnelles"
    },
    {
      title: "Formation complète",
      description: "Apprends à créer, lancer et vendre ton application IA no-code avec notre méthode éprouvée"
    },
    {
      title: "Un appel de groupe par semaine",
      description: "( clique sur \" terminer \" pour rejoindre )"
    }
  ];

  return (
    <section ref={sectionRef} className="minimal-root">
      <style>{`
@import url('https://fonts.cdnfonts.com/css/hubot-sans');

.minimal-root, .minimal-root * {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.minimal-root {
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
  isolation: isolate;
}

/* header */
.header {
  position: absolute;
  top: 0; left: 0; right: 0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  z-index: 10;
}
.brand {
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  text-decoration: none;
}

/* hero center */
.hero {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  pointer-events: none;
  z-index: 5;
  padding: 0 24px;
}
.hero > div {
  pointer-events: auto;
  max-width: 800px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.kicker {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}
.title {
  font-weight: 600;
  font-size: clamp(32px, 8vw, 72px);
  line-height: 0.95;
  margin: 0;
  color: var(--fg);
  text-shadow: none;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.title .gradient-text {
  background: linear-gradient(to right, hsl(263, 93%, 56%), hsl(284, 100%, 84%), hsl(306, 100%, 57%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.subtitle {
  margin-top: 18px;
  font-size: clamp(14px, 2.2vw, 18px);
  color: var(--muted);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Feature card */
.feature-card {
  margin-top: 48px;
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  text-align: left;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.feature-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 12px;
}
.feature-description {
  font-size: 16px;
  color: var(--muted);
  line-height: 1.6;
}

/* Step indicator */
.step-indicator {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 32px;
  min-height: 20px;
}

/* Conteneur du bouton avec hauteur fixe */
.button-container {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
}
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  transition: all 0.3s;
}
.step-dot.active {
  background: hsl(263, 93%, 56%);
  width: 24px;
  border-radius: 4px;
}

/* accent lines container */
.accent-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* base line visuals */
.hline, .vline {
  position: absolute;
  background: var(--border);
  opacity: .75;
  will-change: transform, opacity;
}

/* horizontal lines */
.hline {
  height: 1px; left: 0; right: 0;
  transform: scaleX(0);
  transform-origin: 50% 50%;
  animation: drawX 800ms cubic-bezier(.22,.61,.36,1) forwards;
}
.hline:nth-child(1){ top: 20%; animation-delay: 150ms; }
.hline:nth-child(2){ top: 50%; animation-delay: 280ms; }
.hline:nth-child(3){ top: 80%; animation-delay: 410ms; }

/* vertical lines */
.vline {
  width: 1px; top: 0; bottom: 0;
  transform: scaleY(0);
  transform-origin: 50% 0%;
  animation: drawY 900ms cubic-bezier(.22,.61,.36,1) forwards;
}
.vline:nth-child(4){ left: 20%; animation-delay: 520ms; }
.vline:nth-child(5){ left: 50%; animation-delay: 640ms; }
.vline:nth-child(6){ left: 80%; animation-delay: 760ms; }

/* subtle gradient shimmer while drawing */
.hline::after, .vline::after{
  content:"";
  position:absolute;
  inset:0;
  background: linear-gradient(90deg, transparent, rgba(250,250,250,.25), transparent);
  opacity:0;
  animation: shimmer 900ms ease-out forwards;
}
.hline:nth-child(1)::after{ animation-delay: 150ms; }
.hline:nth-child(2)::after{ animation-delay: 280ms; }
.hline:nth-child(3)::after{ animation-delay: 410ms; }
.vline:nth-child(4)::after{ animation-delay: 520ms; }
.vline:nth-child(5)::after{ animation-delay: 640ms; }
.vline:nth-child(6)::after{ animation-delay: 760ms; }

/* keyframes */
@keyframes drawX {
  0% { transform: scaleX(0); opacity: 0; }
  60% { opacity: .9; }
  100% { transform: scaleX(1); opacity: .75; }
}
@keyframes drawY {
  0% { transform: scaleY(0); opacity: 0; }
  60% { opacity: .9; }
  100% { transform: scaleY(1); opacity: .75; }
}
@keyframes shimmer {
  0% { opacity: .0; }
  30% { opacity: .25; }
  100% { opacity: 0; }
}

/* canvas */
.particleCanvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: .6;
}

/* Discord code */
.discord-code-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 16px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
  word-break: break-all;
}
.discord-code {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
  letter-spacing: 2px;
  text-align: center;
}

/* Isoler la modal Discord du flou GSAP */
[data-radix-portal] {
  filter: none !important;
  isolation: isolate;
}
[data-radix-portal] * {
  filter: none !important;
}
      `}</style>

      {/* Header */}
      <header className="header">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); }}>
          ZeroToApp
        </a>
      </header>

      {/* Particles */}
      <canvas ref={canvasRef} className="particleCanvas" />

      {/* Accent Lines */}
      <div className="accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      {/* Hero */}
      <main className="hero">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`kicker-${currentStep}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="kicker">
                {currentStep === 0 ? "Bienvenue" : `Étape ${currentStep} sur ${features.length}`}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h1
              key={`title-${currentStep}-${userFirstName}`}
              ref={titleRef}
              className="title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {currentStep === 0 ? (
                <>
                  Bienvenue{userFirstName ? `, ${userFirstName}` : ''} !
                  <br />
                  Découvre ce qui t'attend
                </>
              ) : (
                <>
                  {features[currentStep - 1].title}
                </>
              )}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`subtitle-${currentStep}`}
              className="subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              {currentStep === 0 
                ? "Tu vas découvrir toutes les fonctionnalités qui t'aideront à créer et vendre ta première app no-code"
                : features[currentStep - 1].description
              }
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {currentStep > 0 && (
              <motion.div
                key={`feature-card-${currentStep}`}
                className="feature-card"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              >
                <h2 className="feature-title">{features[currentStep - 1].title}</h2>
                <p className="feature-description">{features[currentStep - 1].description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step indicator */}
          <div className="step-indicator">
            {features.map((_, index) => (
              <div 
                key={index} 
                className={`step-dot ${index + 1 === currentStep ? 'active' : ''}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`buttons-${currentStep}`}
              className="button-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}
            >
              {currentStep > 0 && (
                <button
                  onClick={handleGoBack}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 flex items-center justify-center"
                  aria-label="Retour à l'étape précédente"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <ShinyButton onClick={handleContinue}>
                {currentStep < features.length ? 'Continuer' : 'Terminer'}
              </ShinyButton>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Discord Modal */}
      <Dialog open={showDiscordModal} onOpenChange={setShowDiscordModal}>
        <DialogContent 
          className="sm:max-w-md p-6 border-0 overflow-visible rounded-3xl z-[200] bg-transparent"
          style={{ 
            zIndex: 200,
            filter: 'none',
            willChange: 'auto',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <div className="relative w-full">
            {/* Content */}
            <div className="relative z-10">
              <div className="auth-card" style={{ overflow: 'visible' }}>
                <div className="card__border"></div>
                <DialogHeader className="pb-4 text-center">
                  <DialogTitle className="text-2xl font-bold text-white">
                    Rejoins le <span className="text-[#a78bfa] drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">Discord</span> dès maintenant !
                  </DialogTitle>
                  <DialogDescription className="text-[#a1a1aa] mt-2 text-sm">
                    Les appels de groupe sont obligatoires pour progresser ensemble, même en plus des appels personnalisés.
                  </DialogDescription>
                </DialogHeader>
                
                <hr className="line" />
                
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ShinyButton onClick={handleJoinDiscord}>
                    Rejoindre le Discord
                  </ShinyButton>
                  
                  <ShinyButton onClick={handleDiscordModalClose}>
                    J'ai rejoint le Discord
                  </ShinyButton>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

