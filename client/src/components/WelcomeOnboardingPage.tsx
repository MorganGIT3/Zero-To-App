"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { useDramaticSound } from '@/hooks/useDramaticSound';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { ShinyButton } from './ShinyButton';

interface WelcomeOnboardingPageProps {
  onContinue: () => void;
}

export function WelcomeOnboardingPage({ onContinue }: WelcomeOnboardingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loaderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playDramaticSound } = useDramaticSound();
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

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

  useEffect(() => {
    if (!titleRef.current || !isMounted) return;

    // Animation simple sans SplitText pour éviter les conflits avec React
    // Utiliser useEffect au lieu de useGSAP pour éviter les conflits
    const timer = setTimeout(() => {
      if (!titleRef.current || !isMounted) return;
      
      gsap.fromTo(
        titleRef.current,
        {
          filter: 'blur(16px)',
          y: 30,
          opacity: 0,
          scale: 1.06,
        },
        {
          filter: 'blur(0px)',
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.5,
        }
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (titleRef.current && isMounted) {
        gsap.killTweensOf(titleRef.current);
      }
    };
  }, [isMounted]);

  const handleContinue = async () => {
    if (!isMounted) return;
    playDramaticSound();
    // Afficher le loader
    setShowLoader(true);
    // Marquer l'onboarding comme complété
    await markOnboardingComplete();
    // Attendre 3 secondes pour l'animation, puis rediriger
    setTimeout(() => {
      if (isMounted) {
        onContinue();
      }
    }, 3000);
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
    <section ref={sectionRef} className="welcome-onboarding-root" data-page="welcome-onboarding">
      <style>{`
@import url('https://fonts.cdnfonts.com/css/hubot-sans');

.welcome-onboarding-root, .welcome-onboarding-root * {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.welcome-onboarding-root {
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

/* Loader styles */
.loader-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  --bg: #0a0a0a;
  --fg: #fafafa;
  --muted: #a1a1aa;
  --border: #27272a;
  --accent: #e5e7eb;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Hubot Sans', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
}

.loader-particleCanvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: screen;
  opacity: .6;
}

.loader-accent-lines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.loader-accent-lines .hline {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border), transparent);
}

.loader-accent-lines .vline {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--border), transparent);
}

.loader-text {
  font-size: 24px;
  font-weight: 500;
  color: var(--fg);
  margin-bottom: 48px;
  text-align: center;
}

.loader-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.gegga {
  width: 0;
}

.snurra {
  filter: url(#gegga);
}

.stopp1 {
  stop-color: hsl(263, 93%, 56%);
}

.stopp2 {
  stop-color: hsl(306, 100%, 57%);
}

.halvan {
  animation: Snurra1 10s infinite linear;
  stroke-dasharray: 180 800;
  fill: none;
  stroke: url(#gradient);
  stroke-width: 23;
  stroke-linecap: round;
}

.strecken {
  animation: Snurra1 3s infinite linear;
  stroke-dasharray: 26 54;
  fill: none;
  stroke: url(#gradient);
  stroke-width: 23;
  stroke-linecap: round;
}

.skugga {
  filter: blur(5px);
  opacity: 0.3;
  position: absolute;
  transform: translate(3px, 3px);
}

@keyframes Snurra1 {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -403px;
  }
}
      `}</style>

      {/* Header */}
      <motion.header 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.a 
          className="brand" 
          href="#" 
          onClick={(e) => { e.preventDefault(); }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          ZeroToApp
        </motion.a>
      </motion.header>

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
          <motion.div 
            className="kicker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            Bienvenue
          </motion.div>
          <h1 ref={titleRef} className="title">
            Bienvenue{userFirstName ? `, ${userFirstName}` : ''} !
            <br />
            <span className="gradient-text">ZeroToApp</span>
          </h1>
          <motion.p 
            className="subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          >
            Tu es maintenant prêt à créer, lancer et vendre ta première application IA no-code.
          </motion.p>

          {/* Continue button */}
          <motion.div 
            style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.9, type: "spring", stiffness: 200 }}
          >
            <ShinyButton onClick={handleContinue}>
              Dashboard
            </ShinyButton>
          </motion.div>
        </div>
      </main>

      {/* Bottom content */}
      <motion.section 
        className="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
      >
        <motion.div 
          className="tag"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          By TM
        </motion.div>
      </motion.section>

      {/* Loader overlay */}
      {showLoader && (
        <motion.div
          className="loader-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Particles Canvas */}
          <canvas ref={loaderCanvasRef} className="loader-particleCanvas" />

          {/* Accent Lines */}
          <div className="loader-accent-lines">
            <div className="hline" />
            <div className="vline" />
          </div>

          <motion.p
            className="loader-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            Vous allez être redirigé
          </motion.p>
          <div className="loader-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 10 }}>
            <svg className="gegga">
              <defs>
                <filter id="gegga">
                  <feGaussianBlur in="SourceGraphic" stdDeviation={7} result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10" result="inreGegga" />
                  <feComposite in="SourceGraphic" in2="inreGegga" operator="atop" />
                </filter>
              </defs>
            </svg>
            <svg className="snurra" width={200} height={200} viewBox="0 0 200 200">
              <defs>
                <linearGradient id="linjärGradient">
                  <stop className="stopp1" offset={0} />
                  <stop className="stopp2" offset={1} />
                </linearGradient>
                <linearGradient y2={160} x2={160} y1={40} x1={40} gradientUnits="userSpaceOnUse" id="gradient" xlinkHref="#linjärGradient" />
              </defs>
              <path className="halvan" d="m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64" />
              <circle className="strecken" cx={100} cy={100} r={64} />
            </svg>
            <svg className="skugga" width={200} height={200} viewBox="0 0 200 200">
              <path className="halvan" d="m 164,100 c 0,-35.346224 -28.65378,-64 -64,-64 -35.346224,0 -64,28.653776 -64,64 0,35.34622 28.653776,64 64,64 35.34622,0 64,-26.21502 64,-64 0,-37.784981 -26.92058,-64 -64,-64 -37.079421,0 -65.267479,26.922736 -64,64 1.267479,37.07726 26.703171,65.05317 64,64 37.29683,-1.05317 64,-64 64,-64" />
              <circle className="strecken" cx={100} cy={100} r={64} />
            </svg>
          </div>
        </motion.div>
      )}
    </section>
  );
}

