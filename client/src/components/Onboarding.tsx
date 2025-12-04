"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useDramaticSound } from '@/hooks/useDramaticSound';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { ShinyButton } from './ShinyButton';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(SplitText, useGSAP);

interface OnboardingProps {
  onContinue: () => void;
}

export function Onboarding({ onContinue }: OnboardingProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playDramaticSound } = useDramaticSound();
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

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
  }, { scope: sectionRef });

  const handleContinue = async () => {
    playDramaticSound();
    // Marquer l'onboarding comme complété
    await markOnboardingComplete();
    onContinue();
  };

  const markOnboardingComplete = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Mettre à jour le profil utilisateur pour indiquer que l'onboarding est complété
        const { error } = await supabase
          .from('user_profiles')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Erreur lors de la mise à jour du profil:', error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  return (
    <section ref={sectionRef} className="onboarding-root" data-page="onboarding">
      <style>{`
@import url('https://fonts.cdnfonts.com/css/hubot-sans');

.onboarding-root, .onboarding-root * {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.onboarding-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 1000;
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

/* footer section */
.content {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 32px 24px;
  border-top: 1px solid var(--border);
  display: grid;
  place-items: center;
  text-align: center;
  gap: 6px;
  z-index: 5;
}
.content .tag {
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
          <div className="kicker">Bienvenue</div>
          <h1 ref={titleRef} className="title">
            Bienvenue{userFirstName ? `, ${userFirstName}` : ''} !
            <br />
            <span className="gradient-text">ZeroToApp</span>
          </h1>
          <p className="subtitle">
            Tu es maintenant prêt à créer, lancer et vendre ta première application IA no-code.
          </p>

          {/* Continue button */}
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
            <ShinyButton onClick={handleContinue}>
              Commencer
            </ShinyButton>
          </div>
        </div>
      </main>

      {/* Bottom content */}
      <section className="content">
        <div className="tag">By TM</div>
      </section>
    </section>
  );
}

