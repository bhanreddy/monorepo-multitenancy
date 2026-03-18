import { Session, User } from '@supabase/supabase-js';
import { SuperAdmin } from './superAdmin';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSuperAdmin: boolean;
  currentAdmin: SuperAdmin | null;
}
