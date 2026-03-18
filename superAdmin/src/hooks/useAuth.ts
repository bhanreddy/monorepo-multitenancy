import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { authService } from '../services/authService';
import { AuthState } from '../types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isSuperAdmin: false,
    currentAdmin: null,
  });

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session = await authService.getSession();
        if (session && session.user) {
          const { isSuperAdmin, admin } = await authService.isSuperAdmin(session.user.id, session.access_token);
          if (mounted) {
            if (isSuperAdmin) {
              setAuthState({ user: session.user, session, loading: false, isSuperAdmin: true, currentAdmin: admin });
            } else {
              await authService.signOut();
              setAuthState({ user: null, session: null, loading: false, isSuperAdmin: false, currentAdmin: null });
            }
          }
        } else {
          if (mounted) {
            setAuthState({ user: null, session: null, loading: false, isSuperAdmin: false, currentAdmin: null });
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        if (mounted) {
          setAuthState({ user: null, session: null, loading: false, isSuperAdmin: false, currentAdmin: null });
        }
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      try {
        if (session && session.user) {
          const { isSuperAdmin, admin } = await authService.isSuperAdmin(session.user.id, session.access_token);
          if (mounted) {
            if (isSuperAdmin) {
              setAuthState({ user: session.user, session, loading: false, isSuperAdmin: true, currentAdmin: admin });
            } else {
              await authService.signOut();
              setAuthState({ user: null, session: null, loading: false, isSuperAdmin: false, currentAdmin: null });
            }
          }
        } else {
          if (mounted) {
            setAuthState({ user: null, session: null, loading: false, isSuperAdmin: false, currentAdmin: null });
          }
        }
      } catch (err) {
        console.error('Error in onAuthStateChange:', err);
        if (mounted) {
          setAuthState({ user: null, session: null, loading: false, isSuperAdmin: false, currentAdmin: null });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...authState,
    signOut: authService.signOut,
  };
};
