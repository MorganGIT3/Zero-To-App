import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, LogOut, Shield } from 'lucide-react';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ShinyButton } from './ShinyButton';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  accompaniment_start_date?: string | null;
  accompaniment_end_date?: string | null;
}

export function ProfilePage({ onLogout }: { onLogout?: () => void }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Charger les données depuis user_profiles pour avoir les dates d'accompagnement
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('accompaniment_start_date, accompaniment_end_date')
          .eq('user_id', user.id)
          .single();

        setUserProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          accompaniment_start_date: profile?.accompaniment_start_date || null,
          accompaniment_end_date: profile?.accompaniment_end_date || null
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout?.();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-block mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-2">
            Mon Compte
          </h1>
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-[#a78bfa]/40 to-transparent"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
        </motion.div>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Section Informations de connexion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-[#a78bfa]" />
              <h2 className="text-sm font-semibold text-white">Informations de connexion</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                <Mail className="h-4 w-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-xs mb-0.5">Email</p>
                  <p className="text-white text-sm font-medium truncate">{userProfile?.email || 'Non disponible'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section Accompagnement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-[#a78bfa]" />
              <h2 className="text-sm font-semibold text-white">Accompagnement</h2>
            </div>
            
            {userProfile?.accompaniment_start_date && userProfile?.accompaniment_end_date ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                  <Calendar className="h-4 w-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white/50 text-xs mb-0.5">Période d'accompagnement</p>
                    <p className="text-white text-sm font-medium">
                      Du {new Date(userProfile.accompaniment_start_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })} au {new Date(userProfile.accompaniment_end_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                  <Shield className="h-4 w-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white/50 text-xs mb-0.5">Statut</p>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const startDate = new Date(userProfile.accompaniment_start_date);
                      const endDate = new Date(userProfile.accompaniment_end_date);
                      
                      let status = '';
                      let statusColor = '';
                      
                      if (today < startDate) {
                        status = 'En attente';
                        statusColor = 'text-gray-400';
                      } else if (today >= startDate && today <= endDate) {
                        status = 'En cours';
                        statusColor = 'text-green-400';
                      } else {
                        status = 'Terminé';
                        statusColor = 'text-blue-400';
                      }
                      
                      return (
                        <p className={`text-sm font-medium ${statusColor}`}>
                          {status}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg">
                <Calendar className="h-4 w-4 text-[#a78bfa] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white/50 text-xs mb-0.5">Dates d'accompagnement</p>
                  <p className="text-white text-sm font-medium">Non définies</p>
                  <p className="text-white/40 text-xs mt-1">Les dates seront définies par votre administrateur</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bouton Déconnexion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <ShinyButton
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 text-base"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </ShinyButton>
        </motion.div>
      </motion.div>
    </div>
  );
}

