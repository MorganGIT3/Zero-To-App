"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useDramaticSound } from '@/hooks/useDramaticSound';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { ShinyButton } from './ShinyButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const discordCode = "REJOINS_DISCORD_MAINTENANT"; // Code Discord d'invitation

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

    document.fonts.ready.then(() => {
      const split = new SplitText(titleRef.current!, {
        type: 'lines',
        wordsClass: 'lines',
      });

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
    });
  }, { scope: sectionRef, dependencies: [currentStep] });

  const handleContinue = () => {
    if (currentStep < features.length - 1) {
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

  const features = [
    {
      title: "Accompagnement personnalisé",
      description: "Des appels par semaine pour t'accompagner au mieux à vendre ta première app no-code à une entreprise",
      icon: "📞"
    },
    {
      title: "Ressources de design",
      description: "Un accès à des sites de design que tu peux intégrer à ton app pour créer des interfaces professionnelles",
      icon: "🎨"
    },
    {
      title: "Formation complète",
      description: "Apprends à créer, lancer et vendre ton application IA no-code avec notre méthode éprouvée",
      icon: "🚀"
    },
    {
      title: "Communauté active",
      description: "Rejoins une communauté de créateurs et entrepreneurs pour échanger et progresser ensemble",
      icon: "👥"
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
}
.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
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
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-top: 16px;
}
.discord-code {
  font-family: monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
  flex: 1;
  letter-spacing: 2px;
}
.copy-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.copy-button:hover {
  background: rgba(255, 255, 255, 0.15);
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
          <div className="kicker">
            {currentStep === 0 ? "Bienvenue" : `Étape ${currentStep + 1} sur ${features.length}`}
          </div>
          <h1 ref={titleRef} className="title">
            {currentStep === 0 ? (
              <>
                Bienvenue{userFirstName ? `, ${userFirstName}` : ''} !
                <br />
                Découvre ce qui t'attend
              </>
            ) : (
              <>
                {features[currentStep].title}
              </>
            )}
          </h1>
          <p className="subtitle">
            {currentStep === 0 
              ? "Tu vas découvrir toutes les fonctionnalités qui t'aideront à créer et vendre ta première app no-code"
              : features[currentStep].description
            }
          </p>

          {currentStep > 0 && (
            <div className="feature-card">
              <span className="feature-icon">{features[currentStep].icon}</span>
              <h2 className="feature-title">{features[currentStep].title}</h2>
              <p className="feature-description">{features[currentStep].description}</p>
            </div>
          )}

          {/* Step indicator */}
          <div className="step-indicator">
            {features.map((_, index) => (
              <div 
                key={index} 
                className={`step-dot ${index === currentStep ? 'active' : ''}`}
              />
            ))}
          </div>

          {/* Continue button */}
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
            <ShinyButton onClick={handleContinue}>
              {currentStep < features.length - 1 ? 'Continuer' : 'Terminer'}
            </ShinyButton>
          </div>
        </div>
      </main>

      {/* Discord Modal */}
      <Dialog open={showDiscordModal} onOpenChange={setShowDiscordModal}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-[#27272a] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">
              Rejoins le Discord dès maintenant !
            </DialogTitle>
            <DialogDescription className="text-[#a1a1aa] mt-2">
              Les appels de groupe sont obligatoires pour progresser ensemble. Voici ton code d'invitation :
            </DialogDescription>
          </DialogHeader>
          <div className="discord-code-container">
            <span className="discord-code">{discordCode}</span>
            <button 
              onClick={copyDiscordCode}
              className="copy-button"
            >
              {discordCodeCopied ? (
                <>
                  <Check size={16} />
                  Copié !
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copier
                </>
              )}
            </button>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <ShinyButton onClick={handleDiscordModalClose}>
              J'ai rejoint le Discord
            </ShinyButton>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

