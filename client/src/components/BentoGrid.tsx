import { ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight, Target, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[16rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

const ParticleCanvas = ({ isHovered }: { isHovered: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      size: number;
    };

    let particles: Particle[] = [];
    let isAnimating = false;

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 20,
      speed: Math.random() * 0.08 + 0.05,
      opacity: Math.random() * 0.4 + 0.3,
      size: Math.random() * 2.5 + 1.5,
    });

    const init = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const draw = () => {
      if (!isAnimating) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.y -= p.speed;
        p.opacity -= 0.001;
        
        if (p.y < -5 || p.opacity <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 20;
          p.opacity = Math.random() * 0.4 + 0.3;
          p.speed = Math.random() * 0.08 + 0.05;
        }
        
        ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size * 2);
      });
      
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    const startAnimation = () => {
      if (isAnimating) return;
      setSize();
      init();
      isAnimating = true;
      draw();
    };

    const stopAnimation = () => {
      isAnimating = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (isHovered) {
      startAnimation();
    } else {
      stopAnimation();
    }

    const handleResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      stopAnimation();
      window.removeEventListener("resize", handleResize);
    };
  }, [isHovered]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// Composants d'animation spécifiques pour chaque carte
const BookCallAnimation = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ opacity: 0, scale: 0, y: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
          y: [0, -20, -40],
          x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.3,
          ease: "easeOut",
        }}
        style={{
          left: `${20 + i * 30}%`,
          top: '60%',
        }}
      >
        <Target className="h-4 w-4 text-[#a78bfa]/60" />
      </motion.div>
    ))}
  </div>
);

const DiscordAnimation = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1.2, 0],
          y: [0, -15, -30],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeOut",
        }}
        style={{
          left: `${15 + i * 25}%`,
          top: '50%',
        }}
      >
        <div className="w-2 h-2 rounded-full bg-[#a78bfa]/50" />
      </motion.div>
    ))}
  </div>
);

const AIAssistantAnimation = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.5, 0.5],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut",
        }}
        style={{
          left: `${10 + i * 20}%`,
          top: `${30 + (i % 2) * 30}%`,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
      </motion.div>
    ))}
  </div>
);

const FormationAnimation = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: [0, 1, 0],
          y: [10, -10, -20],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          delay: i * 0.4,
          ease: "easeInOut",
        }}
        style={{
          left: `${25 + i * 25}%`,
          top: '55%',
        }}
      >
        <Shield className="h-3 w-3 text-[#a78bfa]/50" />
      </motion.div>
    ))}
  </div>
);

const ResourcesAnimation = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
          rotate: [0, 90, 180],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeOut",
        }}
        style={{
          left: `${10 + (i % 3) * 30}%`,
          top: `${20 + Math.floor(i / 3) * 40}%`,
        }}
      >
        <div className="w-2 h-2 border border-[#a78bfa]/60 rotate-45" />
      </motion.div>
    ))}
  </div>
);

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  onClick,
  hoverAnimation,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href?: string;
  cta: string;
  onClick?: () => void;
  hoverAnimation?: ReactNode;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <style>{`
        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: hsl(284, 100%, 84%);
          inherits: false;
        }

        .bento-card-shiny {
          --shiny-cta-bg: hsl(240, 15%, 9%);
          --shiny-cta-bg-subtle: hsl(240, 15%, 12%);
          --shiny-cta-highlight: hsl(263, 93%, 56%);
          --shiny-cta-highlight-subtle: hsl(306, 100%, 57%);
          --animation: gradient-angle linear infinite;
          --duration: 15s;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
          --gradient-pos-1-x: 88%;
          --gradient-pos-1-y: 40%;
          --gradient-pos-2-x: 49%;
          --gradient-pos-2-y: 30%;
          --gradient-pos-3-x: 14%;
          --gradient-pos-3-y: 26%;
          --gradient-pos-4-x: 0%;
          --gradient-pos-4-y: 64%;
          --gradient-pos-5-x: 41%;
          --gradient-pos-5-y: 94%;
          --gradient-pos-6-x: 100%;
          --gradient-pos-6-y: 99%;
          
          isolation: isolate;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background-color: hsla(240, 15%, 9%, 1);
          box-shadow: 0px -16px 24px 0px rgba(255, 255, 255, 0.25) inset;
          transition: var(--transition);
        }

        .bento-card-shiny::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: radial-gradient(
              at var(--gradient-pos-1-x) var(--gradient-pos-1-y),
              hsla(240, 15%, 9%, 1) 0px,
              transparent 85%
            ),
            radial-gradient(at var(--gradient-pos-2-x) var(--gradient-pos-2-y), hsla(240, 15%, 9%, 1) 0px, transparent 85%),
            radial-gradient(at var(--gradient-pos-3-x) var(--gradient-pos-3-y), hsla(240, 15%, 9%, 1) 0px, transparent 85%),
            radial-gradient(at var(--gradient-pos-4-x) var(--gradient-pos-4-y), hsla(263, 93%, 56%, 1) 0px, transparent 85%),
            radial-gradient(at var(--gradient-pos-5-x) var(--gradient-pos-5-y), hsla(284, 100%, 84%, 1) 0px, transparent 85%),
            radial-gradient(at var(--gradient-pos-6-x) var(--gradient-pos-6-y), hsla(306, 100%, 57%, 1) 0px, transparent 85%);
          transition: background-image 1.5s ease-in-out;
        }

        .bento-card-shiny:hover::after {
          --gradient-pos-1-x: 75%;
          --gradient-pos-1-y: 35%;
          --gradient-pos-2-x: 60%;
          --gradient-pos-2-y: 25%;
          --gradient-pos-3-x: 25%;
          --gradient-pos-3-y: 20%;
          --gradient-pos-4-x: 15%;
          --gradient-pos-4-y: 70%;
          --gradient-pos-5-x: 55%;
          --gradient-pos-5-y: 85%;
          --gradient-pos-6-x: 90%;
          --gradient-pos-6-y: 95%;
        }

        .bento-card-shiny::before {
          content: "";
          pointer-events: none;
          position: absolute;
          z-index: 1;
          --size: calc(100% - 8px);
          --position: 3px;
          --space: calc(var(--position) * 2);
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
            circle at var(--position) var(--position),
            white calc(var(--position) / 4),
            transparent 0
          ) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 5% 95%,
            black
          );
          border-radius: inherit;
          opacity: 0.4;
          animation: gradient-angle var(--duration) linear infinite;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes gradient-drift {
          0% {
            --gradient-x: 45%;
            --gradient-y: 45%;
          }
          25% {
            --gradient-x: 55%;
            --gradient-y: 48%;
          }
          50% {
            --gradient-x: 52%;
            --gradient-y: 55%;
          }
          75% {
            --gradient-x: 48%;
            --gradient-y: 52%;
          }
          100% {
            --gradient-x: 45%;
            --gradient-y: 45%;
          }
        }

        @keyframes shimmer {
          to {
            rotate: 360deg;
          }
        }
      `}</style>
      <div
        key={name}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "bento-card-shiny group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
          "backdrop-blur-2xl bg-white/[0.02]",
          "transform-gpu cursor-pointer",
          className,
        )}
      >
        <div>{background}</div>
        {isHovered && <ParticleCanvas isHovered={isHovered} />}
        {/* Grille du fond */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        </div>
        <div className="pointer-events-none z-10 flex transform-gpu flex-col justify-between h-full p-6 transition-all duration-300">
          <div className="flex flex-col items-start w-full">
            <h3 className="text-sm md:text-base font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
              {name}
            </h3>
            <div className="h-px bg-gradient-to-r from-transparent via-[#a78bfa]/40 to-transparent w-full" />
          </div>
          <div className="flex items-center justify-center flex-1">
            <Icon className="h-8 w-8 origin-center transform-gpu text-[#a78bfa] transition-all duration-300 ease-in-out group-hover:scale-90 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
          </div>
        </div>
      </div>
    </>
  );
};

export { BentoCard, BentoGrid, BookCallAnimation, DiscordAnimation, AIAssistantAnimation, FormationAnimation, ResourcesAnimation };

