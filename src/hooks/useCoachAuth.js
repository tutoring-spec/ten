import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook che verifica se l'utente corrente è un allenatore con accesso attivo.
 *
 * Ritorna:
 *   loading  — true mentre controlla
 *   coach    — l'oggetto CoachCourseAccess se autenticato e approvato, null altrimenti
 *   user     — l'utente base44 autenticato, null se non loggato
 *   logout   — funzione per fare logout
 */
export function useCoachAuth() {
  const [loading, setLoading] = useState(true);
  const [coach, setCoach]     = useState(null);
  const [user, setUser]       = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;

        if (!me) {
          setUser(null);
          setCoach(null);
          setLoading(false);
          return;
        }

        setUser(me);

        const accesses = await base44.entities.CoachCourseAccess.filter({
          coach_email: me.email,
          active: true,
        });

        if (cancelled) return;
        setCoach(accesses.length > 0 ? accesses[0] : null);
      } catch {
        if (!cancelled) { setUser(null); setCoach(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  const logout = async () => {
    await base44.auth.logout().catch(() => {});
    window.location.href = '/accesso';
  };

  return { loading, coach, user, logout };
}
