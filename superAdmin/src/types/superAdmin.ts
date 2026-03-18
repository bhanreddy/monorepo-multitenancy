export interface SuperAdmin {
  id: string; // UUID
  email: string;
  full_name: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  last_login: string | null;
}

export interface CreateSuperAdminPayload {
  email: string;
  password: string;
  full_name: string;
}
