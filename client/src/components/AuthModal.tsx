import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { signUpUser, signInUser, resetPassword, supabase, getCurrentUser } from "@/lib/supabase";
import { useAuthSound } from "@/hooks/useAuthSound";
import { useUserRecognition } from "@/hooks/useUserRecognition";
import { ShinyButton } from "./ShinyButton";
import "./auth-card.css";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
  onSignupSuccess?: () => void; // Callback spécifique pour l'inscription
  defaultTab?: "login" | "signup";
}

export function AuthModal({ open, onOpenChange, onAuthSuccess, onSignupSuccess, defaultTab = "login" }: AuthModalProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "", 
    name: "" 
  });
  const [resetEmail, setResetEmail] = useState("");
  const { playAuthSound } = useAuthSound();
  const { markUserAsLoggedIn } = useUserRecognition();

  // Mettre à jour l'onglet actif quand defaultTab change
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await signInUser(loginData.email, loginData.password);
      
      if (error) {
        setError("Email ou mot de passe incorrect");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log('Connexion réussie:', data.user);
        // Marquer l'utilisateur comme connecté pour la reconnaissance future
        markUserAsLoggedIn(data.user.email || loginData.email);
        
        // Vérifier le statut d'onboarding pour rediriger vers welcome-onboarding si nécessaire
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('user_id', data.user.id)
            .single();

          // Si pas de profil ou onboarding non complété, rediriger vers welcome-onboarding
          if (!profile || !profile.onboarding_completed) {
            onOpenChange(false);
            navigate('/welcome-onboarding');
            return;
          }
        } catch (profileError) {
          console.log('Profil non trouvé ou erreur, redirection vers welcome-onboarding:', profileError);
          // En cas d'erreur, rediriger vers welcome-onboarding pour les nouveaux comptes
          onOpenChange(false);
          navigate('/welcome-onboarding');
          return;
        }

        // Si l'onboarding est complété, utiliser le callback par défaut
        onAuthSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (signupData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    playAuthSound();
    setIsLoading(true);
    setError("");

    try {
      console.log('Tentative d\'inscription...');
      const { data, error } = await signUpUser(signupData.email, signupData.password, signupData.name);
      
      console.log('Réponse inscription:', { data, error });
      
      if (error) {
        console.error('Erreur inscription:', error);
        
        // Messages d'erreur plus clairs
        let errorMessage = "Erreur lors de la création du compte";
        if (error.message.includes('already registered')) {
          errorMessage = "Cet email est déjà utilisé";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Adresse email invalide";
        } else if (error.message.includes('Password')) {
          errorMessage = "Mot de passe trop faible";
        } else {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        return;
      }

      if (data.user) {
        console.log('Inscription réussie:', data.user);
        
        // Vérifier si l'email doit être confirmé
        if (data.user.email_confirmed_at) {
          // Email confirmé, connexion automatique
          // Marquer l'utilisateur comme connecté pour la reconnaissance future
          markUserAsLoggedIn(data.user.email || signupData.email);
          // Pour une nouvelle inscription, toujours rediriger vers l'onboarding
          onSignupSuccess?.();
          onOpenChange(false);
        } else {
          // Email non confirmé, afficher message
          setError("Un email de confirmation a été envoyé. Vérifiez votre boîte de réception.");
          // Attendre un peu puis fermer le modal
          setTimeout(() => {
            // Même si l'email n'est pas confirmé, on redirige vers l'onboarding pour les nouveaux comptes
            onSignupSuccess?.();
            onOpenChange(false);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setError("Une erreur est survenue lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await resetPassword(resetEmail);
      
      if (error) {
        let errorMessage = "Erreur lors de l'envoi de l'email de réinitialisation";
        if (error.message.includes('Invalid email')) {
          errorMessage = "Adresse email invalide";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Trop de tentatives. Veuillez attendre quelques minutes";
        } else {
          errorMessage = error.message;
        }
        setError(errorMessage);
        return;
      }

      setSuccess("Un email de réinitialisation a été envoyé à votre adresse email.");
      setResetEmail("");
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      setError("Une erreur est survenue lors de l'envoi de l'email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* SVG Filters for button effects */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="unopaq">
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 1"></feFuncA>
            </feComponentTransfer>
          </filter>
          <filter id="unopaq2">
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 1"></feFuncA>
            </feComponentTransfer>
          </filter>
          <filter id="unopaq3">
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 1"></feFuncA>
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-6 border-0 overflow-hidden rounded-3xl z-[200] bg-transparent">
        <div className="relative w-full">
          {/* Content */}
          <div className="relative z-10">
            <DialogHeader className="pb-6 text-center">
              <DialogTitle className="text-2xl font-bold text-white">
                Bienvenu dans <span className="text-[#a78bfa] drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">ZeroToApp</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 border-white/20">
                <TabsTrigger 
                  value="login" 
                  data-testid="tab-login"
                  className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  data-testid="tab-signup"
                  className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="auth-card">
                  <div className="card__border"></div>
                  <div className="card_title__container">
                    <h3 className="card_title">Se connecter</h3>
                    <p className="card_paragraph">
                      Connectez-vous à votre compte pour accéder au dashboard
                    </p>
                  </div>
                  <hr className="line" />
                  <div>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-white">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                          data-testid="input-login-email"
                          className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 rounded-2xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-white">Mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            data-testid="input-login-password"
                            className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 rounded-2xl"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/60 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[#a78bfa] hover:text-purple-300 text-sm underline transition-colors duration-200"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <div className="mt-6">
                        <ShinyButton 
                          type="submit" 
                          disabled={isLoading}
                        >
                          {isLoading ? "Connexion..." : "Se connecter"}
                        </ShinyButton>
                      </div>
                    </form>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="signup">
                <div className="auth-card">
                  <div className="card__border"></div>
                  <div className="card_title__container">
                    <h3 className="card_title">Créer un compte</h3>
                  </div>
                  <hr className="line" style={{ marginBottom: '0.5rem' }} />
                  <div>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-white">Nom complet</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Votre nom"
                          value={signupData.name}
                          onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-signup-name"
                          className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 rounded-2xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                          data-testid="input-signup-email"
                          className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 rounded-2xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white">Mot de passe</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.password}
                          onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                          data-testid="input-signup-password"
                          className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 rounded-2xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm" className="text-white">Confirmer le mot de passe</Label>
                        <Input
                          id="signup-confirm"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          data-testid="input-signup-confirm"
                          className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 rounded-2xl"
                          required
                        />
                      </div>
                      <div className="mt-6">
                        <ShinyButton 
                          type="submit" 
                          disabled={isLoading}
                        >
                          {isLoading ? "Inscription..." : "S'inscrire"}
                        </ShinyButton>
                      </div>
                    </form>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Modal de réinitialisation de mot de passe */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md p-6 border-0 overflow-hidden rounded-3xl z-[300] bg-transparent">
          <div className="relative w-full">
            {/* Content */}
            <div className="relative z-10">
              <DialogHeader className="pb-6 text-center">
                <DialogTitle className="text-2xl font-bold text-white">
                  Réinitialiser le mot de passe
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
                    {success}
                  </div>
                )}
                
                <div className="auth-card">
                  <div className="card__border"></div>
                  <div className="card_title__container">
                    <h3 className="card_title">Email de réinitialisation</h3>
                    <p className="card_paragraph">
                      Entrez votre adresse email pour recevoir un lien de réinitialisation
                    </p>
                  </div>
                  <hr className="line" />
                  <div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-white">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 rounded-2xl"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setShowForgotPassword(false)}
                          className="flex-1 border border-white/20 text-white hover:bg-white/10 rounded-lg py-2.5 px-4 transition-all duration-200"
                        >
                          Annuler
                        </button>
                        <div className="button-container flex-1" style={{ display: 'flex', justifyContent: 'center' }}>
                          <button 
                            type="submit" 
                            disabled={isLoading}
                            className="button"
                          >
                            {isLoading ? "Envoi..." : "Envoyer"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}