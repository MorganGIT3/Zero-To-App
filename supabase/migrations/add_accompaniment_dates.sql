-- =====================================================
-- AJOUT DES COLONNES DE DATES D'ACCOMPAGNEMENT
-- =====================================================
-- Migration pour ajouter les dates de début et fin d'accompagnement
-- à la table user_profiles

-- 1. Ajouter les colonnes d'accompagnement
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS accompaniment_start_date DATE,
ADD COLUMN IF NOT EXISTS accompaniment_end_date DATE;

-- 2. Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_user_profiles_accompaniment_dates 
ON public.user_profiles(accompaniment_start_date, accompaniment_end_date);

-- 3. Créer la fonction RPC pour mettre à jour les dates d'accompagnement
CREATE OR REPLACE FUNCTION update_user_accompaniment_dates(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    accompaniment_start_date = p_start_date,
    accompaniment_end_date = p_end_date,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Commentaires pour la documentation
COMMENT ON COLUMN public.user_profiles.accompaniment_start_date IS 'Date de début de l''accompagnement de l''utilisateur';
COMMENT ON COLUMN public.user_profiles.accompaniment_end_date IS 'Date de fin de l''accompagnement de l''utilisateur';
COMMENT ON FUNCTION update_user_accompaniment_dates IS 'Met à jour les dates de début et fin d''accompagnement pour un utilisateur';
