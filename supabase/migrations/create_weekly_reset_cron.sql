-- =====================================================
-- CRON JOB POUR RÉINITIALISATION HEBDOMADAIRE DES CALLS
-- =====================================================
-- Ce script configure un cron job qui s'exécute chaque lundi à 00:00 UTC
-- pour réinitialiser les appels de tous les utilisateurs à 2

-- 1. Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Fonction pour réinitialiser les appels de tous les utilisateurs
CREATE OR REPLACE FUNCTION reset_weekly_call_limits()
RETURNS void AS $$
DECLARE
  v_current_week_start DATE;
  v_reset_count INTEGER;
BEGIN
  v_current_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  
  -- Mettre à jour tous les utilisateurs dont la semaine de début est différente
  UPDATE user_call_limits
  SET 
    calls_remaining = 2,
    calls_used = 0,
    last_reset_date = CURRENT_DATE,
    week_start_date = v_current_week_start,
    updated_at = NOW()
  WHERE week_start_date < v_current_week_start;
  
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  
  -- Log pour le débogage
  RAISE NOTICE 'Réinitialisation hebdomadaire effectuée: % utilisateur(s) mis à jour', v_reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Supprimer le cron job existant s'il existe
SELECT cron.unschedule('reset-weekly-call-limits') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reset-weekly-call-limits'
);

-- 4. Créer le cron job pour exécuter la fonction chaque lundi à 00:00 UTC
-- Format cron: minute hour day-of-month month day-of-week
-- 0 0 * * 1 = chaque lundi à 00:00 UTC
SELECT cron.schedule(
  'reset-weekly-call-limits',
  '0 0 * * 1', -- Chaque lundi à 00:00 UTC
  $$SELECT reset_weekly_call_limits()$$
);

-- 5. Vérifier que le cron job a été créé
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'reset-weekly-call-limits';




