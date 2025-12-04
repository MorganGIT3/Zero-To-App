import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, BrainCog, SendIcon, Sparkles, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShinyButton } from "./ShinyButton";

// ⚠️ CONFIGURATION - Clé OpenAI via variable d'environnement
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ""; // 🔒 Clé sécurisée

// Prompt par défaut (celui de Prosmo)
const DEFAULT_PROMPT = `Tu es **Smart AI Assistant**, l'assistant officiel de Prosmo.
Tu as été conçu par **Morgan** et **Yohan**, deux experts qui créent et vendent des applications IA no-code à plus de 2000 €.
Ton rôle : aider les utilisateurs à créer, connecter, personnaliser et vendre leurs applications **de la façon la plus simple, rapide et concrète possible**.

---

### 🎯 MISSION
Aide les utilisateurs à :
- Connecter leurs outils (Supabase, Cursor, n8n, Vercel, Stripe, etc.)
- Créer une app fonctionnelle rapidement
- Résoudre les bugs courants
- Comprendre comment vendre leur app et augmenter la valeur perçue
- Simplifier les process (jamais faire compliqué pour rien)
- Automatiser sans code inutile

---

### 🧩 PHILOSOPHIE DE RÉPONSE
1. **Toujours la base la plus simple possible.**
   - Si un résultat peut se faire avec 2 outils, **n'en propose jamais 4.**
   - Si c'est faisable directement depuis Cursor ou Supabase, ne dis pas d'aller sur 10 plateformes.
   - Ta devise : *"Minimum de complexité, maximum d'efficacité."*

2. **Réponses ultra-concrètes.**
   - Donne les étapes exactes, les boutons à cliquer, les noms de menus, etc.
   - Évite les grandes théories ou les phrases floues.
   - Ex : "Clique sur le logo Supabase en haut → va dans *Connection* → ouvre l'onglet *MCP* → clique sur *Connect Cursor*…"

3. **Ton de voix humain et motivant.**
   - Toujours positif, bienveillant et encourageant.
   - Parle comme un ami expert qui aide un entrepreneur à avancer.
   - Ex : "Ok parfait, on va faire ça ensemble c'est super simple 💪"

4. **Toujours structuré.**
   - Étapes numérotées, tirets, sections claires.

5. **Si tu ne sais pas, dis-le simplement.**
   - Exemple : "Je ne suis pas certain, peux-tu me préciser ton outil ou ton objectif ?"

---

### 📚 BASE DE CONNAISSANCE

#### 🔌 Connexions et intégrations

**Q : Comment connecter Supabase à Cursor ?**
Salut ! Pour connecter Supabase à Cursor, suis ces étapes 👇
1️⃣ Crée ton projet Supabase.
2️⃣ En haut au milieu de ton écran, clique sur **"Connection"**.
3️⃣ Une fenêtre s'ouvre → Va dans **"MCP"**.
4️⃣ Descends un peu, tu verras **"Connect Cursor"**.
5️⃣ Clique dessus (ton projet Cursor doit être ouvert).
6️⃣ Cursor va te montrer les paramètres MCP ; **change le nom du projet** pour éviter les conflits.
7️⃣ Clique sur **"Save MCP"** dans Cursor.
8️⃣ Accepte les autorisations (popup "Open" ou "OK").
✅ Et c'est tout ! Supabase est maintenant connecté à ton projet Cursor.

**Q : Pourquoi utiliser Cursor au lieu de Lovable ou Replit ?**
Très simple 👇
- Cursor te donne **l'IA la plus rapide et la plus précise** pour coder.
- Tu payes une seule fois, pas par "requête" comme sur Lovable ou Replit.
- Tu peux directement connecter Supabase, Vercel, Stripe, et ton propre backend.
- C'est parfait pour créer des apps professionnelles à vendre 1500–3000 €.
💡 En gros, Cursor = liberté + IA + productivité.

#### 💰 VENTE D'APPLICATIONS

**Q : Comment vendre mon application à 2000 € ?**
1️⃣ Choisis une niche (artisans, piscinistes, agents immobiliers, etc.).
2️⃣ Trouve 3–4 **problèmes précis** qu'ils ont (perte de temps, devis manuels, etc.).
3️⃣ Crée une app avec **un design magnifique** et **1 fonctionnalité clé**.
4️⃣ Montre l'app sur un **Loom** ou une **démo visuelle**.
5️⃣ Contacte 10 entreprises locales → explique que ton app **automatise leur quotidien**.
💸 Propose 2000 € + 250 € de setup.

**Q : Quelle différence entre vendre un workflow n8n et une app IA ?**
- Workflow n8n → trop abstrait, les clients ne visualisent pas.
- Application IA → visuel, concret, valeur perçue x10.
Combiner les deux (app + workflow intégré) = 💰💰💰`;

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-blue-400 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{ 
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: "0 0 4px rgba(96, 165, 250, 0.3)"
          }}
        />
      ))}
    </div>
  );
}

export function SmartAIAssistantSimple() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  // Charger le prompt depuis localStorage au démarrage
  useEffect(() => {
    const savedPrompt = localStorage.getItem('smartai_system_prompt');
    const prompt = savedPrompt || DEFAULT_PROMPT;
    setSystemPrompt(prompt);
  }, []);

  // Suivi de la souris pour l'effet de lumière
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);


  // Envoyer un message à OpenAI
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Vérifier la clé API
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "sk-votre-clé-openai-ici") {
      alert('⚠️ Veuillez configurer votre clé OpenAI dans le fichier .env (VITE_OPENAI_API_KEY)');
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Construire l'historique des messages pour OpenAI
      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10).map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        { role: 'user' as const, content: message }
      ];

      // Appeler OpenAI directement
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 1000,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Erreur lors de l\'appel à OpenAI');
      }

      const data = await response.json();
      const aiAnswer = data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiAnswer,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Désolé, une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}. Vérifiez votre clé API OpenAI.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      handleSendMessage(input);
      adjustHeight(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full items-center justify-center bg-transparent text-white p-6 relative overflow-hidden" style={{ zIndex: 10, isolation: 'isolate' }}>
      {/* Effets de fond animés */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>


      {/* Contenu principal */}
      <div className="w-full max-w-4xl mx-auto relative" style={{ zIndex: 10 }}>
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          {messages.length === 0 && (
            <div className="text-center space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block"
              >
                <h1 className="text-2xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                  Smart AI Assistant
                </h1>
                <motion.div 
                  className="h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </motion.div>
              <motion.p 
                className="text-sm text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Assistant Prosmo par Morgan & Yohan
              </motion.p>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto px-2">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 backdrop-blur-xl ${
                      message.sender === 'user'
                        ? 'bg-[#a78bfa]/20 border border-[#a78bfa]/30 text-white'
                        : 'bg-white/[0.02] border border-white/[0.05] text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Input Box */}
          <motion.div 
            className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Posez votre question à l'assistant Prosmo..."
                className={cn(
                  "w-full px-4 py-3",
                  "resize-none",
                  "bg-transparent",
                  "border-none",
                  "text-white/90 text-sm",
                  "focus:outline-none",
                  "placeholder:text-white/20",
                  "min-h-[60px]"
                )}
                style={{
                  overflow: "hidden",
                }}
                disabled={isLoading}
              />
            </div>

            <div className="p-4 border-t border-white/[0.05] flex items-center justify-end gap-4">
              <ShinyButton
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className={cn(
                  "px-4 py-2 text-sm flex items-center gap-2",
                  !input.trim() && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                <span>Envoyer</span>
              </ShinyButton>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Indicateur de chargement */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 backdrop-blur-2xl bg-white/[0.02] rounded-full px-4 py-2 shadow-lg border border-white/[0.05] z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-7 rounded-full bg-[#a78bfa]/20 flex items-center justify-center text-center">
                <Sparkles className="w-4 h-4 text-[#a78bfa]" />
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>L'IA réfléchit</span>
                <TypingDots />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effet de lumière qui suit la souris */}
      {inputFocused && (
        <motion.div 
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 blur-[96px]"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

