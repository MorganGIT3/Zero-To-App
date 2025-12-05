import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

// Composants d'animation spécifiques pour chaque carte (désactivés - plus d'animations de particules)
const BookCallAnimation = () => null;
const DiscordAnimation = () => null;
const AIAssistantAnimation = () => null;
const FormationAnimation = () => null;
const ResourcesAnimation = () => null;

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

        @property --gradient-pos-1-x {
          syntax: "<percentage>";
          initial-value: 88%;
          inherits: false;
        }

        @property --gradient-pos-1-y {
          syntax: "<percentage>";
          initial-value: 40%;
          inherits: false;
        }

        @property --gradient-pos-2-x {
          syntax: "<percentage>";
          initial-value: 49%;
          inherits: false;
        }

        @property --gradient-pos-2-y {
          syntax: "<percentage>";
          initial-value: 30%;
          inherits: false;
        }

        @property --gradient-pos-3-x {
          syntax: "<percentage>";
          initial-value: 14%;
          inherits: false;
        }

        @property --gradient-pos-3-y {
          syntax: "<percentage>";
          initial-value: 26%;
          inherits: false;
        }

        @property --gradient-pos-4-x {
          syntax: "<percentage>";
          initial-value: 0%;
          inherits: false;
        }

        @property --gradient-pos-4-y {
          syntax: "<percentage>";
          initial-value: 64%;
          inherits: false;
        }

        @property --gradient-pos-5-x {
          syntax: "<percentage>";
          initial-value: 41%;
          inherits: false;
        }

        @property --gradient-pos-5-y {
          syntax: "<percentage>";
          initial-value: 94%;
          inherits: false;
        }

        @property --gradient-pos-6-x {
          syntax: "<percentage>";
          initial-value: 100%;
          inherits: false;
        }

        @property --gradient-pos-6-y {
          syntax: "<percentage>";
          initial-value: 99%;
          inherits: false;
        }

        .bento-card-shiny {
          --white: hsl(0, 0%, 100%);
          --black: hsl(240, 15%, 9%);
          --paragraph: hsl(0, 0%, 83%);
          --line: hsl(240, 9%, 17%);
          --primary: hsl(266, 92%, 58%);
          
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          background-color: hsla(240, 15%, 9%, 1);
          background-image: radial-gradient(
              at 88% 40%,
              hsla(240, 15%, 9%, 1) 0px,
              transparent 85%
            ),
            radial-gradient(at 49% 30%, hsla(240, 15%, 9%, 1) 0px, transparent 85%),
            radial-gradient(at 14% 26%, hsla(240, 15%, 9%, 1) 0px, transparent 85%),
            radial-gradient(at 0% 64%, hsla(263, 93%, 56%, 1) 0px, transparent 85%),
            radial-gradient(at 41% 94%, hsla(284, 100%, 84%, 1) 0px, transparent 85%),
            radial-gradient(at 100% 99%, hsla(306, 100%, 57%, 1) 0px, transparent 85%);
          border-radius: 1rem;
          box-shadow: 0px -16px 24px 0px rgba(255, 255, 255, 0.25) inset;
          isolation: isolate;
          overflow: hidden;
        }


        /* Grille stylée dans les coins - Suppression des points blancs qui tournent */
        .bento-card-shiny::before {
          content: "";
          pointer-events: none;
          position: absolute;
          z-index: 1;
          inset: 0;
          border-radius: inherit;
          opacity: 0.35;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-position 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background-image: 
            /* Coin haut gauche - grille horizontale et verticale */
            repeating-linear-gradient(
              90deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            ),
            /* Coin haut droit */
            repeating-linear-gradient(
              90deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            ),
            /* Coin bas gauche */
            repeating-linear-gradient(
              90deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            ),
            /* Coin bas droit */
            repeating-linear-gradient(
              90deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(167, 139, 250, 0.5) 0px,
              rgba(167, 139, 250, 0.5) 1px,
              transparent 1px,
              transparent 20px
            );
          background-size: 
            80px 80px,
            80px 80px,
            80px 80px,
            80px 80px,
            80px 80px,
            80px 80px,
            80px 80px,
            80px 80px;
          background-position: 
            0 0,
            0 0,
            100% 0,
            100% 0,
            0 100%,
            0 100%,
            100% 100%,
            100% 100%;
          background-repeat: no-repeat;
          mask-image: 
            radial-gradient(ellipse 80px 80px at 0 0, black 60%, transparent 85%),
            radial-gradient(ellipse 80px 80px at 100% 0, black 60%, transparent 85%),
            radial-gradient(ellipse 80px 80px at 0 100%, black 60%, transparent 85%),
            radial-gradient(ellipse 80px 80px at 100% 100%, black 60%, transparent 85%);
          mask-size: 50% 50%;
          mask-position: 0 0, 100% 0, 0 100%, 100% 100%;
          mask-repeat: no-repeat;
        }

        .bento-card-shiny:hover::before {
          opacity: 1;
          background-position: 
            12px 12px,
            12px 12px,
            calc(100% - 12px) 12px,
            calc(100% - 12px) 12px,
            12px calc(100% - 12px),
            12px calc(100% - 12px),
            calc(100% - 12px) calc(100% - 12px),
            calc(100% - 12px) calc(100% - 12px);
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
        className={cn(
          "bento-card-shiny group relative col-span-1 flex flex-col justify-between cursor-pointer",
          className,
        )}
      >
        <div>{background}</div>
        {/* Bordure LED animée */}
        <div className="card__border"></div>
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

