import React, { useState, useEffect } from 'react';
import { getCurrentAdminSession, logoutAdmin, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LogOut, Shield, Phone, Users, Calendar, RefreshCw, Mail, UserCircle2, Clock, Settings, Save, X, RotateCcw, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AdminSession {
  code: string;
  name: string;
  level: string;
  description: string;
  permissions: string[];
  loginTime: string;
}

interface UserWithCalls {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  total_calls: number;
  accompaniment_start_date: string | null;
  accompaniment_end_date: string | null;
}

interface Booking {
  id: string;
  booking_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  booking_date: string;
  event_type: string | null;
  status: string;
  created_at: string;
}

interface CallStats {
  totalCalls: number;
  weeklyCalls: number;
  activeUsers: number;
  usersInAccompaniment: number;
}

// Prompt par défaut
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

3. **Ton de voix humain et motivant.**
   - Toujours positif, bienveillant et encourageant.
   - Parle comme un ami expert qui aide un entrepreneur à avancer.

4. **Toujours structuré.**
   - Étapes numérotées, tirets, sections claires.

5. **Si tu ne sais pas, dis-le simplement.**`;

type FilterStatus = 'all' | 'pending' | 'active' | 'completed';

export function AdminDashboard() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserWithCalls[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    weeklyCalls: 0,
    activeUsers: 0,
    usersInAccompaniment: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  // États pour l'édition inline des dates
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingStartDate, setEditingStartDate] = useState('');
  const [editingEndDate, setEditingEndDate] = useState('');
  const [isSavingDates, setIsSavingDates] = useState(false);
  
  // États pour la gestion de l'app
  const [showAppManagement, setShowAppManagement] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [editedPrompt, setEditedPrompt] = useState("");

  // Charger le prompt depuis localStorage
  useEffect(() => {
    const savedPrompt = localStorage.getItem('smartai_system_prompt');
    const prompt = savedPrompt || DEFAULT_PROMPT;
    setSystemPrompt(prompt);
    setEditedPrompt(prompt);
  }, []);

  useEffect(() => {
    const session = getCurrentAdminSession();
    setAdminSession(session);
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUsersWithCalls(),
        loadAllBookings(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersWithCalls = async () => {
    try {
      // Charger les profils utilisateurs
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Erreur chargement profils:', profilesError);
        setUsers([]);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        return;
      }

      // Pour chaque profil, compter les appels depuis calcom_bookings
      const usersWithCalls: UserWithCalls[] = [];
      
      for (const profile of profiles) {
        const { count } = await supabase
          .from('calcom_bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .neq('status', 'cancelled');

        usersWithCalls.push({
          id: profile.user_id || profile.id || 'unknown',
          user_id: profile.user_id || profile.id || 'unknown',
          email: profile.email || 'Non renseigné',
          full_name: profile.full_name || profile.email?.split('@')[0] || 'Utilisateur',
          created_at: profile.created_at || new Date().toISOString(),
          total_calls: count || 0,
          accompaniment_start_date: profile.accompaniment_start_date || null,
          accompaniment_end_date: profile.accompaniment_end_date || null
        });
      }

      setUsers(usersWithCalls);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    }
  };

  const loadAllBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('calcom_bookings')
        .select('*')
        .order('booking_date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Erreur chargement bookings:', error);
        setBookings([]);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des bookings:', error);
      setBookings([]);
    }
  };

  const calculateStats = async () => {
    try {
      // Total des appels
      const { count: totalCount } = await supabase
        .from('calcom_bookings')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'cancelled');

      // Appels cette semaine
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Lundi
      startOfWeek.setHours(0, 0, 0, 0);

      const { count: weeklyCount } = await supabase
        .from('calcom_bookings')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'cancelled')
        .gte('booking_date', startOfWeek.toISOString());

      // Utilisateurs actifs (avec au moins 1 appel)
      const { count: activeCount } = await supabase
        .from('calcom_bookings')
        .select('user_id', { count: 'exact', head: true })
        .neq('status', 'cancelled')
        .not('user_id', 'is', null);

      // Utilisateurs en accompagnement (avec dates définies)
      const { count: accompanimentCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .not('accompaniment_start_date', 'is', null)
        .not('accompaniment_end_date', 'is', null);

      setStats({
        totalCalls: totalCount || 0,
        weeklyCalls: weeklyCount || 0,
        activeUsers: activeCount || 0,
        usersInAccompaniment: accompanimentCount || 0
      });
    } catch (error) {
      console.error('Erreur calcul stats:', error);
    }
  };

  const updateAccompanimentDates = async (userId: string, startDate: string | null, endDate: string | null) => {
    setIsSavingDates(true);
    try {
      const { error } = await supabase.rpc('update_user_accompaniment_dates', {
        p_user_id: userId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Erreur mise à jour dates:', error);
        alert('Erreur lors de la mise à jour des dates');
        return;
      }

      // Recharger les utilisateurs
      await loadUsersWithCalls();
      setEditingUserId(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour des dates');
    } finally {
      setIsSavingDates(false);
    }
  };

  const startEditingDates = (user: UserWithCalls) => {
    setEditingUserId(user.user_id);
    setEditingStartDate(user.accompaniment_start_date || '');
    setEditingEndDate(user.accompaniment_end_date || '');
  };

  const cancelEditingDates = () => {
    setEditingUserId(null);
    setEditingStartDate('');
    setEditingEndDate('');
  };

  const saveDates = async (userId: string) => {
    await updateAccompanimentDates(
      userId,
      editingStartDate || null,
      editingEndDate || null
    );
  };

  const getAccompanimentStatus = (user: UserWithCalls): 'pending' | 'active' | 'completed' => {
    if (!user.accompaniment_start_date || !user.accompaniment_end_date) {
      return 'pending';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(user.accompaniment_start_date);
    const endDate = new Date(user.accompaniment_end_date);

    if (today < startDate) {
      return 'pending';
    } else if (today >= startDate && today <= endDate) {
      return 'active';
    } else {
      return 'completed';
    }
  };

  const filteredUsers = users.filter(user => {
    // Filtre par statut
    if (filterStatus !== 'all') {
      const status = getAccompanimentStatus(user);
      if (status !== filterStatus) return false;
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.email.toLowerCase().includes(query) ||
        user.full_name.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const filteredBookings = bookings.filter(booking => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.email.toLowerCase().includes(query) ||
        (booking.name && booking.name.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleLogout = () => {
    logoutAdmin();
    setAdminSession(null);
    window.location.reload();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSavePrompt = () => {
    localStorage.setItem('smartai_system_prompt', editedPrompt);
    setSystemPrompt(editedPrompt);
    setShowAppManagement(false);
    alert('✅ Prompt sauvegardé avec succès !');
  };

  const handleResetPrompt = () => {
    if (confirm('Voulez-vous vraiment réinitialiser le prompt au paramètre par défaut ?')) {
      setEditedPrompt(DEFAULT_PROMPT);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white/80 text-xl"
        >
          Chargement du tableau de bord...
        </motion.div>
      </div>
    );
  }

  if (!adminSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 max-w-md w-full"
        >
          <h2 className="text-white text-xl font-semibold text-center mb-2">Accès Refusé</h2>
          <p className="text-white/60 text-sm text-center mb-6">
            Aucune session admin active trouvée
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full backdrop-blur-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white"
          >
            Retour à l'accueil
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 mb-2">
              Dashboard Admin
            </h1>
            <p className="text-white/60 text-sm">
              Suivi des appels d'accompagnement • {adminSession.name}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowAppManagement(true)}
              className="backdrop-blur-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Gestion de l'app
            </Button>
            <Button 
              onClick={handleLogout}
              className="backdrop-blur-2xl bg-white/[0.05] hover:bg-red-500/20 border border-white/[0.1] text-red-400 hover:text-red-300 transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </motion.div>

        {/* Statistiques Globales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-sm font-medium text-white/80">Total des appels</h3>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.totalCalls}</div>
              <p className="text-white/50 text-xs">Tous les temps</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-sm font-medium text-white/80">Cette semaine</h3>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.weeklyCalls}</div>
              <p className="text-white/50 text-xs">Appels pris cette semaine</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-sm font-medium text-white/80">Utilisateurs actifs</h3>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.activeUsers}</div>
              <p className="text-white/50 text-xs">Avec au moins 1 appel</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-sm font-medium text-white/80">En accompagnement</h3>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.usersInAccompaniment}</div>
              <p className="text-white/50 text-xs">Dates définies</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Liste des utilisateurs avec appels et dates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-white text-xl font-semibold flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-[#a78bfa]" />
                  Utilisateurs et accompagnement
                </h2>
                <p className="text-white/50 text-sm">
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} • Gérez les dates d'accompagnement
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 backdrop-blur-2xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/40 w-64"
                  />
                </div>
                <div className="flex gap-1 backdrop-blur-2xl bg-white/[0.05] border border-white/[0.1] rounded-lg p-1">
                  <Button
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className={filterStatus === 'all' ? 'bg-white/[0.1] text-white' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/[0.05]'}
                  >
                    Tous
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                    className={filterStatus === 'pending' ? 'bg-white/[0.1] text-white' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/[0.05]'}
                  >
                    En attente
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setFilterStatus('active')}
                    className={filterStatus === 'active' ? 'bg-white/[0.1] text-white' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/[0.05]'}
                  >
                    En cours
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setFilterStatus('completed')}
                    className={filterStatus === 'completed' ? 'bg-white/[0.1] text-white' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/[0.05]'}
                  >
                    Terminé
                  </Button>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  size="sm"
                  className="backdrop-blur-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserCircle2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Utilisateur</th>
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Date d'inscription</th>
                      <th className="text-center py-3 px-4 text-white/60 text-sm font-medium">Appels pris</th>
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Date début</th>
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Date fin</th>
                      <th className="text-center py-3 px-4 text-white/60 text-sm font-medium">Statut</th>
                      <th className="text-center py-3 px-4 text-white/60 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => {
                      const status = getAccompanimentStatus(user);
                      const isEditing = editingUserId === user.user_id;

                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#a78bfa] to-purple-500 flex items-center justify-center text-white font-bold">
                                {user.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-white font-medium">{user.full_name}</div>
                                <div className="text-white/50 text-sm flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-white text-sm">
                              {new Date(user.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className="backdrop-blur-2xl bg-white/[0.1] border border-white/[0.1] text-white text-lg px-3 py-1">
                              {user.total_calls}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editingStartDate}
                                onChange={(e) => setEditingStartDate(e.target.value)}
                                className="backdrop-blur-2xl bg-white/[0.05] border border-white/[0.1] text-white w-40"
                              />
                            ) : (
                              <div className="text-white text-sm">
                                {user.accompaniment_start_date
                                  ? new Date(user.accompaniment_start_date).toLocaleDateString('fr-FR')
                                  : 'Non définie'}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editingEndDate}
                                onChange={(e) => setEditingEndDate(e.target.value)}
                                className="backdrop-blur-2xl bg-white/[0.05] border border-white/[0.1] text-white w-40"
                              />
                            ) : (
                              <div className="text-white text-sm">
                                {user.accompaniment_end_date
                                  ? new Date(user.accompaniment_end_date).toLocaleDateString('fr-FR')
                                  : 'Non définie'}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge
                              className={
                                status === 'pending'
                                  ? 'backdrop-blur-2xl bg-white/[0.1] border border-white/[0.1] text-white/80'
                                  : status === 'active'
                                  ? 'backdrop-blur-2xl bg-green-500/20 border border-green-500/30 text-green-400'
                                  : 'backdrop-blur-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400'
                              }
                            >
                              {status === 'pending' ? 'En attente' : status === 'active' ? 'En cours' : 'Terminé'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => saveDates(user.user_id)}
                                    disabled={isSavingDates}
                                    className="backdrop-blur-2xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400"
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={cancelEditingDates}
                                    disabled={isSavingDates}
                                    className="backdrop-blur-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white/60 hover:text-white"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => startEditingDates(user)}
                                  className="backdrop-blur-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white"
                                >
                                  Modifier
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tous les appels pris */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-white text-xl font-semibold flex items-center gap-2 mb-1">
                  <Phone className="w-5 h-5 text-[#a78bfa]" />
                  Tous les appels pris
                </h2>
                <p className="text-white/50 text-sm">
                  {filteredBookings.length} appel{filteredBookings.length > 1 ? 's' : ''} enregistré{filteredBookings.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Rechercher par email ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 backdrop-blur-2xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/40 w-64"
                />
              </div>
            </div>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Aucun appel enregistré</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Nom</th>
                      <th className="text-left py-3 px-4 text-white/60 text-sm font-medium">Type</th>
                      <th className="text-center py-3 px-4 text-white/60 text-sm font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking, index) => (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="text-white text-sm">
                            {new Date(booking.booking_date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-white text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3 text-white/40" />
                            {booking.email}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-white text-sm">{booking.name || 'Non renseigné'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-white/50 text-sm">{booking.event_type || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge
                            className={
                              booking.status === 'scheduled'
                                ? 'backdrop-blur-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400'
                                : booking.status === 'completed'
                                ? 'backdrop-blur-2xl bg-green-500/20 border border-green-500/30 text-green-400'
                                : 'backdrop-blur-2xl bg-white/[0.1] border border-white/[0.1] text-white/80'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* App Management Modal */}
      <Dialog open={showAppManagement} onOpenChange={setShowAppManagement}>
        <DialogContent className="max-w-[90vw] md:max-w-[800px] backdrop-blur-2xl bg-white/[0.02] border border-white/[0.05] z-[200]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#a78bfa]" />
              Gestion du Prompt IA
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Modifiez le prompt système de l'assistant IA. Ce prompt définit sa personnalité et ses règles de réponse.
            </DialogDescription>
          </DialogHeader>

          <textarea
            className="flex w-full rounded-xl backdrop-blur-2xl bg-white/[0.05] border border-white/[0.1] px-4 py-3 text-base text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50 min-h-[300px] resize-y"
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            placeholder="Écrivez le prompt système ici..."
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={handleResetPrompt} className="backdrop-blur-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </Button>
            <Button onClick={handleSavePrompt} className="backdrop-blur-2xl bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 border border-[#a78bfa]/30 text-[#a78bfa] flex items-center gap-2">
              <Save className="w-4 h-4" />
              Enregistrer le prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
