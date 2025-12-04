import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export function ResourcesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-block mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-2">
            Ressources graphiques
          </h1>
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-[#a78bfa]/40 to-transparent"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-white/60 mb-12"
        >
          Accède à toutes les ressources graphiques pour créer tes applications
        </motion.p>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte 21st.dev */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onClick={() => window.open('https://21st.dev/community/components', '_blank', 'noopener,noreferrer')}
            className="group backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 hover:border-[#a78bfa]/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  21st.dev Components
                  <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-[#a78bfa] transition-colors" />
                </h3>
                <p className="text-white/60 text-sm">
                  Bibliothèque de composants UI modernes et gratuits pour vos projets
                </p>
              </div>
            </div>
          </motion.div>

          {/* Carte Uiverse */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onClick={() => window.open('https://uiverse.io/elements', '_blank', 'noopener,noreferrer')}
            className="group backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 hover:border-[#a78bfa]/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  Uiverse Elements
                  <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-[#a78bfa] transition-colors" />
                </h3>
                <p className="text-white/60 text-sm">
                  Collection d'éléments UI créatifs et animés pour enrichir vos interfaces
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

