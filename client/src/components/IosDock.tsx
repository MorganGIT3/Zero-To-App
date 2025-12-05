import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Target, BrainCog, Shield, User, LogOut, Image, MessageCircle } from 'lucide-react';

// Tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative" style={{ zIndex: 100000 }}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-1.5 text-xs text-white bg-[#0a0a0a] border border-[#27272a] rounded-lg shadow-2xl whitespace-nowrap"
          style={{ 
            zIndex: 100001,
            pointerEvents: 'none',
            marginBottom: '12px'
          }}
        >
          {content}
          {/* Flèche pointant vers le bas */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #27272a',
            }}
          />
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]"
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #0a0a0a',
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

// Dock item component
const DockItem = ({ children, tooltip }: { children: React.ReactNode; tooltip: string }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.22, y: -9 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="relative"
    >
      <Tooltip content={tooltip}>
        {children}
      </Tooltip>
    </motion.div>
  );
};

// Separator component
const Separator = () => (
  <div className="w-px h-7 bg-white/10 mx-1" />
);

// Main dock component
const Dock = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <style>{`
        .ios-dock-container {
          --bg: #0a0a0a;
          --fg: #fafafa;
          --border: #27272a;
          --muted: #a1a1aa;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(17, 17, 17, 0.8);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 0 40px rgba(167, 139, 250, 0.1);
          position: relative;
          overflow: visible;
        }
        .ios-dock-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(167, 139, 250, 0.1) 0%,
            rgba(139, 92, 246, 0.05) 50%,
            rgba(167, 139, 250, 0.1) 100%
          );
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .ios-dock-container:hover::before {
          opacity: 1;
        }
        .ios-dock-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(167, 139, 250, 0.3),
            transparent
          );
        }
      `}</style>
      <div className="ios-dock-container">
        {children}
      </div>
    </>
  );
};

interface IosDockProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

export function IosDock({ currentView, onNavigate, onProfileClick, onLogout }: IosDockProps) {
  const menuItems = [
    { icon: Home, label: 'Dashboard', view: '/dashboard' },
    { icon: Target, label: 'Book un Call', view: '/book-call' },
    { icon: BrainCog, label: 'Smart AI Assistant', view: '/ai-assistant' },
    { icon: Shield, label: 'Formation', view: '/formation' },
    { icon: Image, label: 'Ressources graphiques', view: '/resources' },
    { icon: MessageCircle, label: 'Discord', view: '/discord' },
  ];

  return (
    <div className="relative" style={{ zIndex: 'inherit' }}>
      <Dock>
        {/* Navigation items */}
        {menuItems.map((item) => (
          <DockItem key={item.view} tooltip={item.label}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (item.view === '/formation') {
                  const newWindow = window.open(
                    "https://alive-buffer-ca8.notion.site/SmartApp-Academy-Cr-e-lance-et-vends-ton-application-IA-no-code-des-entreprises-en-30-jours-86dc953a59a14aceae127c06e675a098",
                    "_blank",
                    "noopener,noreferrer"
                  );
                  if (newWindow) {
                    newWindow.opener = null;
                  }
                } else {
                  onNavigate(item.view);
                }
              }}
              className={`w-10 h-10 rounded-lg bg-transparent hover:bg-white/5 flex items-center justify-center transition-all duration-200 ${
                currentView === item.view 
                  ? 'bg-white/10 border border-white/20 shadow-lg shadow-[#a78bfa]/20' 
                  : 'border border-transparent hover:border-white/10'
              }`}
              aria-label={item.label}
            >
              <item.icon className={`w-5 h-5 transition-colors ${
                currentView === item.view 
                  ? 'text-[#a78bfa] drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' 
                  : 'text-white/70 hover:text-white'
              }`} />
            </button>
          </DockItem>
        ))}

        <Separator />

        {/* Profile */}
        <DockItem tooltip="Profil">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNavigate('/profile');
            }}
            className="w-10 h-10 rounded-lg bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-center transition-all duration-200"
            aria-label="Profil"
          >
            <User className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
          </button>
        </DockItem>

        {/* Logout */}
        <DockItem tooltip="Logout">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLogout();
            }}
            className="w-10 h-10 rounded-lg bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-center transition-all duration-200"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-red-400/80 hover:text-red-400 transition-colors" />
          </button>
        </DockItem>
      </Dock>
    </div>
  );
}
