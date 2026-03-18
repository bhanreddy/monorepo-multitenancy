export interface School {
  id: number;
  name: string;
  code: string;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateSchoolPayload {
  name: string;
  code: string;
  address?: string;
  logo_url?: string;
}

export interface SchoolHealth {
  school_id: number;
  student_count: number;
  staff_count: number;
  active_users: number;
  last_activity: string | null;
}

export interface FirstAdminPayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender_id?: number;
  dob?: string;
}
