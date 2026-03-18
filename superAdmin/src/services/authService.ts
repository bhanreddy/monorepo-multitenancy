import { supabase } from './supabase';
import { apiService } from './apiService';
import { Session, User } from '@supabase/supabase-js';
import { SuperAdmin } from '../types/superAdmin';

export const authService = {
  async signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, session: data.session, error };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async isSuperAdmin(userId: string, jwt: string): Promise<{ isSuperAdmin: boolean; admin: SuperAdmin | null }> {
    try {
      const response = await apiService.get('/api/super-admin/verify');
      return {
        isSuperAdmin: response.data.isSuperAdmin === true,
        admin: response.data.admin || null,
      };
    } catch (err) {
      return { isSuperAdmin: false, admin: null };
    }
  },

  async refreshSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.refreshSession();
    return session;
  }
};
